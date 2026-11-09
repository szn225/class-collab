-- Stage 1: additive initialization only. Leaves all legacy tables and buckets unchanged.
begin;
create table if not exists public.hui_state (
 id boolean primary key default true check (id), revision bigint not null default 0,
 state jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now()
);
insert into public.hui_state(id) values(true) on conflict do nothing;
alter table public.hui_state enable row level security;
revoke all on public.hui_state from public, anon, authenticated;
create or replace function public.hui_read() returns jsonb language sql security definer set search_path=public as $$
 select jsonb_build_object('revision',revision,'state',state) from hui_state where id=true;
$$;
create or replace function public.hui_commit(expected_revision bigint,next_state jsonb) returns boolean
language plpgsql security definer set search_path=public as $$
declare changed integer;
begin
 if jsonb_typeof(next_state) <> 'object' or not next_state ? 'config' then raise exception 'Invalid state'; end if;
 update hui_state set state=next_state, revision=revision+1, updated_at=now() where id=true and revision=expected_revision;
 get diagnostics changed=row_count;
 return changed=1;
end; $$;
revoke all on function public.hui_read() from public, anon, authenticated;
revoke all on function public.hui_commit(bigint,jsonb) from public, anon, authenticated;
grant execute on function public.hui_read() to service_role;
grant execute on function public.hui_commit(bigint,jsonb) to service_role;
-- New files must never use the old public materials bucket.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('hui-materials','hui-materials',false,10485760,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false;

notify pgrst, 'reload schema';
commit;
