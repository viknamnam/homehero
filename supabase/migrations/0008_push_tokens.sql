-- 0008_push_tokens.sql
-- Notifications (register #61): one Expo push token per member, used ONLY by
-- the notify-thanks function. Deleting the row = opting out (the in-app
-- toggle does exactly that). No notification history is stored.

create table if not exists push_tokens (
  member_id uuid primary key references members(id) on delete cascade,
  token text not null,
  platform text not null default 'unknown',
  updated_at timestamptz not null default now()
);

alter table push_tokens enable row level security;

-- Household members can manage tokens for members of their own household
-- (a member row has no auth binding for kids; the shared-device adult manages it).
create policy push_select on push_tokens for select
  using (member_id in (select id from members where household_id in (select my_household_ids())));
create policy push_write on push_tokens for all
  using (member_id in (select id from members where household_id in (select my_household_ids())))
  with check (member_id in (select id from members where household_id in (select my_household_ids())));
