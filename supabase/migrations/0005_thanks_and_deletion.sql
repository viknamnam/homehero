-- 0005: wire the Phase 2 Thanks screen to the appreciations table, and add the
-- trust-layer delete path (build plan §13: export & delete are user rights).

-- Idempotent sync (same client_id convention as tasks) + optional category
alter table appreciations add column if not exists client_id text unique;
alter table appreciations add column if not exists category_id uuid references categories(id);

-- Senders can withdraw an appreciation; household scope as everywhere else
create policy appr_delete on appreciations for delete
  using (household_id in (select my_household_ids()));

-- Household deletion: any linked member may delete the household (alpha scope —
-- role-gated deletion arrives with roles/permissions; logged in Gaps #25).
-- All child rows cascade via the 0001 foreign keys.
create policy hh_delete on households for delete
  using (id in (select my_household_ids()));
