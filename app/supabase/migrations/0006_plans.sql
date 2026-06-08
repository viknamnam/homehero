-- 0006: cloud sync for Plan the Day (flip blocker for the planTheDay flag).
create table if not exists planned_tasks (
  id uuid primary key default gen_random_uuid(),
  client_id text unique,
  household_id uuid not null references households(id) on delete cascade,
  category_key text not null,
  title text,
  assigned_member_id uuid references members(id) on delete set null,
  repeat text not null default 'none',
  weekday int,
  anchor_date date not null,
  claimed_by uuid references members(id) on delete set null,
  claimed_date date,
  completed_dates jsonb not null default '[]',
  created_by uuid references members(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table planned_tasks enable row level security;
create policy plans_select on planned_tasks for select using (household_id in (select my_household_ids()));
create policy plans_insert on planned_tasks for insert with check (household_id in (select my_household_ids()));
create policy plans_update on planned_tasks for update using (household_id in (select my_household_ids()));
create policy plans_delete on planned_tasks for delete using (household_id in (select my_household_ids()));
create index if not exists plans_hh_idx on planned_tasks(household_id);
