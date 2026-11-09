-- Stage 2: coordinated release only, after backup and verification of the v2 app.
-- This changes access to the old public tables/bucket; do not run during preparation.
begin;
do $$ begin
 if to_regclass('public.hui_state') is null or to_regprocedure('public.hui_read()') is null then
  raise exception 'Run hui-v2-prepare.sql and verify v2 before cutover';
 end if;
end $$;
-- Legacy PostgREST tables cannot remain an anonymous bypass of the new API.
revoke all on public."User",public."Topic",public."Member",public."Material",public."Article" from public, anon, authenticated;
alter table public."User" enable row level security;
alter table public."Topic" enable row level security;
alter table public."Member" enable row level security;
alter table public."Material" enable row level security;
alter table public."Article" enable row level security;
grant select on public."User",public."Topic",public."Member",public."Material",public."Article" to service_role;
-- Targeted restrictive rule also closes pre-existing permissive Storage policies.
drop policy if exists hui_protect_materials on storage.objects;
create policy hui_protect_materials on storage.objects as restrictive for all to anon,authenticated
using (bucket_id not in ('materials','hui-materials'))
with check (bucket_id not in ('materials','hui-materials'));
-- Historical public objects must stop being anonymously downloadable.
update storage.buckets set public=false where id='materials';
commit;
