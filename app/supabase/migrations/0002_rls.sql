-- Row Level Security: the trust layer. Household isolation enforced SERVER-SIDE.
-- TODO before Phase 2 exit: test suite that attempts cross-household reads and asserts failure.

alter table households enable row level security;
alter table members enable row level security;
alter table categories enable row level security;
alter table rates enable row level security;
alter table tasks enable row level security;
alter table appreciations enable row level security;
alter table invites enable row level security;

-- helper: households the current auth user belongs to
create or replace function my_household_ids() returns setof uuid as $$
  select household_id from members where auth_user_id = auth.uid()
$$ language sql stable security definer;

create policy hh_select on households for select using (id in (select my_household_ids()));
create policy hh_update on households for update using (id in (select my_household_ids()));
create policy hh_insert on households for insert with check (true); -- creator becomes member in same transaction (app responsibility)

create policy mem_select on members for select using (household_id in (select my_household_ids()));
create policy mem_insert on members for insert with check (household_id in (select my_household_ids()));
create policy mem_update on members for update using (household_id in (select my_household_ids()));

create policy cat_select on categories for select using (household_id in (select my_household_ids()));
create policy cat_write  on categories for all    using (household_id in (select my_household_ids()));

create policy rate_select on rates for select using (household_id in (select my_household_ids()));
create policy rate_write  on rates for all    using (household_id in (select my_household_ids()));

create policy task_select on tasks for select using (household_id in (select my_household_ids()));
create policy task_insert on tasks for insert with check (household_id in (select my_household_ids()));
create policy task_update on tasks for update using (household_id in (select my_household_ids()));
create policy task_delete on tasks for delete using (household_id in (select my_household_ids()));

create policy appr_select on appreciations for select using (household_id in (select my_household_ids()));
create policy appr_insert on appreciations for insert with check (household_id in (select my_household_ids()));

-- PRIVATE NOTES: clients must read this view, never tasks.notes directly.
create or replace view tasks_visible as
select t.id, t.household_id, t.category_id, t.title, t.occurred_at, t.duration_min,
       t.assigned_member_id, t.created_by_member_id, t.source, t.is_recurring_instance,
       t.value_amount, t.created_at,
       case when m.auth_user_id = auth.uid() then t.notes else null end as notes
from tasks t
join members m on m.id = t.created_by_member_id;

-- Calculation views (single source of truth)
create or replace view weekly_summary as
select household_id,
       date_trunc('week', occurred_at) as week,
       sum(duration_min) / 60.0 as total_hours,
       sum(value_amount) as total_value
from tasks group by 1, 2;

create or replace view weekly_contribution as
select household_id, date_trunc('week', occurred_at) as week, assigned_member_id,
       sum(duration_min)::float / nullif(sum(sum(duration_min)) over (partition by household_id, date_trunc('week', occurred_at)), 0) as share_time,
       sum(value_amount)::float / nullif(sum(sum(value_amount)) over (partition by household_id, date_trunc('week', occurred_at)), 0) as share_value
from tasks group by 1, 2, 3;

-- TODO Phase 2: child write policy (mark assigned done only), guest read-only view excluding value_amount.
