-- 0003: sync layer — view security fix, invite policies, atomic join functions.
-- Run AFTER 0001 and 0002.

-- SECURITY FIX: Postgres views run with the owner's privileges by default,
-- which would let any authenticated user bypass RLS through these views.
-- security_invoker makes them respect the querying user's RLS.
alter view tasks_visible set (security_invoker = on);
alter view weekly_summary set (security_invoker = on);
alter view weekly_contribution set (security_invoker = on);

-- Invites: members of a household can create and see its invites.
-- Outsiders never read invites directly — they redeem via the function below.
create policy inv_select on invites for select
  using (household_id in (select my_household_ids()));
create policy inv_insert on invites for insert
  with check (household_id in (select my_household_ids()));
create policy inv_update on invites for update
  using (household_id in (select my_household_ids()));

-- Create a household and its first (linked) member atomically.
-- Needed because the members INSERT policy requires existing membership (chicken-and-egg).
create or replace function create_household_and_join(
  p_name text, p_currency char(3), p_member_name text, p_colour text
) returns json
language plpgsql security definer set search_path = public as $$
declare h_id uuid; m_id uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  insert into households (name, currency) values (p_name, p_currency) returning id into h_id;
  insert into members (household_id, auth_user_id, display_name, colour)
  values (h_id, auth.uid(), p_member_name, p_colour) returning id into m_id;
  return json_build_object('household_id', h_id, 'member_id', m_id);
end $$;

-- Redeem an invite code: validates, then links the caller into the household.
-- If an unlinked member with the same name exists (created during upload), claim it
-- so "James" doesn't end up duplicated.
create or replace function redeem_invite(
  p_code text, p_name text, p_colour text
) returns json
language plpgsql security definer set search_path = public as $$
declare inv invites%rowtype; m_id uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select * into inv from invites
    where upper(code) = upper(p_code) and used_by is null and expires_at > now();
  if not found then raise exception 'invalid or expired invite'; end if;

  select id into m_id from members
    where household_id = inv.household_id and auth_user_id = auth.uid();
  if m_id is null then
    select id into m_id from members
      where household_id = inv.household_id and auth_user_id is null
        and lower(display_name) = lower(p_name) limit 1;
    if m_id is not null then
      update members set auth_user_id = auth.uid(), role = inv.role where id = m_id;
    else
      insert into members (household_id, auth_user_id, display_name, role, colour)
      values (inv.household_id, auth.uid(), p_name, inv.role, p_colour)
      returning id into m_id;
    end if;
  end if;

  update invites set used_by = m_id where code = inv.code;
  return json_build_object('household_id', inv.household_id, 'member_id', m_id);
end $$;

grant execute on function create_household_and_join(text, char, text, text) to authenticated;
grant execute on function redeem_invite(text, text, text) to authenticated;
