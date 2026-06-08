-- 0009_remove_member.sql
-- Member removal (register #68). Guardrails:
--   * caller must be an authenticated member of the same household
--   * LINKED members (auth_user_id set) cannot be removed — adults own their
--     own membership; removing your co-adult is not a feature
--   * the member's data goes with them: their tasks and appreciations are
--     deleted; plans assigned to them become OPEN (assigned to no one) rather
--     than vanishing — the work still needs doing
--   * push_tokens row cascades via its FK

create or replace function remove_member(p_member_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare target members%rowtype;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;

  select * into target from members where id = p_member_id;
  if not found then return; end if;

  if target.auth_user_id is not null then
    raise exception 'Linked members manage their own membership.';
  end if;

  if not exists (
    select 1 from members
    where household_id = target.household_id and auth_user_id = auth.uid()
  ) then
    raise exception 'not allowed';
  end if;

  update planned_tasks set assigned_member_id = null where assigned_member_id = p_member_id;
  update planned_tasks set claimed_by = null where claimed_by = p_member_id;
  delete from appreciations where from_member_id = p_member_id or to_member_id = p_member_id;
  delete from tasks where assigned_member_id = p_member_id or created_by_member_id = p_member_id;
  delete from members where id = p_member_id;
end;
$$;

grant execute on function remove_member(uuid) to authenticated;
