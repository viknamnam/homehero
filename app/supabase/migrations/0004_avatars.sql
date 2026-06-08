-- 0004: profile photos — private bucket, household-scoped access.
-- Object paths are `{household_id}/{member_id}.jpg`; foldername(name)[1] is the household.
-- Members only ever see avatars inside households they belong to (same philosophy as 0002 RLS).

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false)
on conflict (id) do nothing;

create policy "avatars household read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] in (select h::text from my_household_ids() h)
  );

create policy "avatars household insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] in (select h::text from my_household_ids() h)
  );

create policy "avatars household update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] in (select h::text from my_household_ids() h)
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] in (select h::text from my_household_ids() h)
  );

create policy "avatars household delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] in (select h::text from my_household_ids() h)
  );
