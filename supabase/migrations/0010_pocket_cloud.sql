-- 0010_pocket_cloud.sql
-- Phase 4: pocket-money settings move from per-device to household-wide, so
-- both parents' phones agree on whether it's on and the points-per-unit rate.
-- (Notification prefs stay per-device by nature — those are not synced.)

alter table households
  add column if not exists pocket_money_enabled boolean not null default false,
  add column if not exists pocket_points_per_unit integer not null default 70;
