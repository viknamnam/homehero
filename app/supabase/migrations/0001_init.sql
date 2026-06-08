-- HomeHero schema v1 (Sprint 1 scope + Phase 2 tables reserved)
-- Run order: 0001_init.sql -> 0002_rls.sql

create type member_role as enum ('adult','child','caregiver','guest');
create type task_source as enum ('manual','template','recurring','voice','ai');

create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  currency char(3) not null default 'AED',
  locale text not null default 'en-AE',
  hide_money boolean not null default false,
  created_at timestamptz not null default now()
);

create table members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  auth_user_id uuid references auth.users(id),
  display_name text not null,
  role member_role not null default 'adult',
  age_group text,
  colour text not null,
  avatar text,
  managed_by uuid references members(id),
  created_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  key text not null,
  name text not null,
  icon text not null,
  colour text not null,
  mental_load_flag boolean not null default false,
  sort_order int not null default 0,
  is_active boolean not null default true,
  unique (household_id, key)
);

create table rates (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  hourly_rate numeric(10,2) not null,
  currency char(3) not null,
  source text not null default 'default',
  unique (household_id, category_id)
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  category_id uuid not null references categories(id),
  title text,
  occurred_at timestamptz not null default now(),
  duration_min int not null check (duration_min > 0 and duration_min <= 1440),
  assigned_member_id uuid not null references members(id),
  created_by_member_id uuid not null references members(id),
  source task_source not null default 'manual',
  notes text,
  is_recurring_instance boolean not null default false,
  recurring_id uuid,
  value_amount numeric(10,2),
  created_at timestamptz not null default now(),
  client_id text unique
);
create index tasks_week on tasks (household_id, occurred_at);

create table appreciations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  from_member_id uuid not null references members(id),
  to_member_id uuid not null references members(id),
  message text,
  related_task_ids uuid[],
  created_at timestamptz not null default now()
);

create table invites (
  code text primary key,
  household_id uuid not null references households(id) on delete cascade,
  role member_role not null default 'adult',
  expires_at timestamptz not null,
  used_by uuid references members(id)
);

-- Seed 13 categories + default flat rate for every new household, server-side.
create or replace function seed_household() returns trigger as $$
declare
  default_rate numeric(10,2);
  cat record;
begin
  default_rate := case new.currency
    when 'AED' then 40 when 'USD' then 15 when 'EUR' then 14 when 'GBP' then 13
    else 15 end; -- TODO: confirm against local market data before alpha

  for cat in select * from (values
    ('cleaning','Cleaning','sparkle','sage',false,1),
    ('cooking','Cooking & food','pan','coral',false,2),
    ('laundry','Laundry','shirt','sky',false,3),
    ('waste','Waste & recycling','recycle','sageDeep',false,4),
    ('child_logistics','Child logistics','car','peach',false,5),
    ('planning','Planning / Admin','clipboard','lavender',true,6),
    ('remembering','Remembering','bulb','lavender',true,7),
    ('emotional','Emotional support','heart','blush',true,8),
    ('pets','Pet care','paw','butter',false,9),
    ('maintenance','Home maintenance','wrench','charcoalSoft',false,10),
    ('shopping','Shopping / errands','bag','teal',false,11),
    ('homework','Homework support','book','sky',false,12),
    ('other','Other','dots','mist',false,13)
  ) as c(key,name,icon,colour,ml,ord)
  loop
    insert into categories (household_id, key, name, icon, colour, mental_load_flag, sort_order)
    values (new.id, cat.key, cat.name, cat.icon, cat.colour, cat.ml, cat.ord);
  end loop;

  insert into rates (household_id, category_id, hourly_rate, currency, source)
  select new.id, c.id, round(default_rate * m.mult, 2), new.currency, 'default'
  from categories c
  join (values
    ('cleaning', 1.00), ('cooking', 1.10), ('laundry', 0.85), ('waste', 0.80),
    ('child_logistics', 1.00), ('planning', 1.05), ('remembering', 1.00), ('emotional', 1.00),
    ('pets', 0.90), ('maintenance', 1.50), ('shopping', 0.95), ('homework', 1.25), ('other', 1.00)
  ) as m(key, mult) on m.key = c.key      -- relative defaults; keep in sync with categories.ts. Regional rates = V1.2.
  where c.household_id = new.id;

  return new;
end;
$$ language plpgsql security definer;

create trigger households_seed after insert on households
for each row execute function seed_household();
