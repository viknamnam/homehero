-- 0011_kid_device_link.sql
-- Kid device-link auth (#48). A child's OWN device gets an anonymous, scoped
-- session — no email, no password, bound to exactly one child member, with no
-- adult view existing on that device at all.
--
-- Flow: parent (adult) creates a single-use kid_link -> child device signs in
-- ANONYMOUSLY -> redeem_kid_link binds that anon user to the child member via
-- kid_devices -> the device launches locked into that child's Kids Mode.
--
-- PREREQUISITE: enable "Anonymous sign-ins" in Supabase dashboard
-- (Authentication -> Providers -> Anonymous). Without it, signInAnonymously fails.

create table if not exists kid_links (
  token text primary key,
  household_id uuid not null references households(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists kid_devices (
  anon_user_id uuid primary key,
  household_id uuid not null references households(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table kid_links enable row level security;
alter table kid_devices enable row level security;

-- Adults of the household manage their own household's kid links
create policy klink_rw on kid_links for all
  using (household_id in (select my_household_ids()))
  with check (household_id in (select my_household_ids()));

-- A kid device can read only its own binding row
create policy kdev_self on kid_devices for select using (anon_user_id = auth.uid());

-- Extend household scope to kid devices: every existing read policy that uses
-- my_household_ids() now also covers a bound kid device — scoped to that one
-- household only, nothing else.
create or replace function my_household_ids() returns setof uuid as $$
  select household_id from members where auth_user_id = auth.uid()
  union
  select household_id from kid_devices where anon_user_id = auth.uid()
$$ language sql stable security definer;

-- Redeem: called by an already-anonymous-signed-in device. Binds it to the
-- child member and burns the single-use link.
create or replace function redeem_kid_link(p_token text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare lnk kid_links%rowtype;
begin
  if auth.uid() is null then raise exception 'sign in first'; end if;
  select * into lnk from kid_links where token = p_token;
  if not found then raise exception 'This link is not valid.'; end if;
  if lnk.used_at is not null then raise exception 'This link has already been used.'; end if;
  if lnk.expires_at < now() then raise exception 'This link has expired.'; end if;

  insert into kid_devices(anon_user_id, household_id, member_id)
    values (auth.uid(), lnk.household_id, lnk.member_id)
    on conflict (anon_user_id) do update
      set household_id = excluded.household_id, member_id = excluded.member_id;
  update kid_links set used_at = now() where token = p_token;

  return jsonb_build_object('memberId', lnk.member_id, 'householdId', lnk.household_id);
end;
$$;

grant execute on function redeem_kid_link(text) to authenticated, anon;
