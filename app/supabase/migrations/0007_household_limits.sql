-- 0007_household_limits.sql
-- Monetisation guardrail (Gaps register #51): subscriptions are per-HOUSEHOLD,
-- so household size needs a server-side ceiling. Invites were already
-- single-use + expiring; this closes the "generate many codes" path.
--
-- Cap: 8 members. Generous for one home (2 parents + 2 grandparents + 4 kids),
-- far too small to be worth splitting a subscription over. One-line change if
-- real households ever need more — and support can raise it per household later.
--
-- Enforced as a BEFORE INSERT trigger so it covers EVERY path that adds a
-- member: redeem_invite, child-profile creation, and household upload.

create or replace function enforce_member_cap() returns trigger
language plpgsql security definer set search_path = public as $$
declare cap int := 8;
begin
  if (select count(*) from members where household_id = new.household_id) >= cap then
    raise exception 'This home already has % members — the most HeroNest supports right now.', cap;
  end if;
  return new;
end;
$$;

drop trigger if exists members_cap on members;
create trigger members_cap
  before insert on members
  for each row execute function enforce_member_cap();
