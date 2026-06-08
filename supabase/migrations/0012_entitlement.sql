-- 0012_entitlement.sql
-- Monetisation (#50): per-household entitlement. 14-day free trial (no card),
-- then a per-household subscription. Lapsed = read-only, export always allowed
-- (§13 — never hold a family's data hostage). Test households are grandfathered.
--
-- premium_until: set by the RevenueCat webhook on purchase/renewal (server work,
-- added at the same time as the RevenueCat rebuild). Trial is derived from the
-- household's created_at, so no separate trial column is needed.

alter table households
  add column if not exists premium_until timestamptz,
  add column if not exists is_grandfathered boolean not null default false;

-- Grandfather every household that already exists at launch of billing (your
-- own + Luis's test households). Run this once, when billing goes live:
--   update households set is_grandfathered = true where created_at < '2026-07-01';
