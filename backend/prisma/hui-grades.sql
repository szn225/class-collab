-- Additive migration: execute after hui-v2-prepare.sql. Existing accounts/activity data unchanged.
begin;
create table if not exists public.hui_grade_students (
 owner_id uuid not null, id text not null, name text not null check(char_length(name) between 1 and 30),
 created_at timestamptz not null default now(), primary key(owner_id,id)
);
create table if not exists public.hui_grade_workspaces (
 owner_id uuid not null, student_id text not null, revision bigint not null default 0,
 values_json jsonb not null default '{}'::jsonb check(jsonb_typeof(values_json)='object'),
 updated_at timestamptz not null default now(), primary key(owner_id,student_id),
 foreign key(owner_id,student_id) references public.hui_grade_students(owner_id,id)
);
create table if not exists public.hui_grade_exams (
 owner_id uuid not null, student_id text not null, id text not null, payload jsonb not null,
 deleted boolean not null default false, revision bigint not null,
 primary key(owner_id,student_id,id), foreign key(owner_id,student_id) references public.hui_grade_students(owner_id,id)
);
create table if not exists public.hui_grade_plans (
 owner_id uuid not null, student_id text not null, id text not null, payload jsonb not null,
 deleted boolean not null default false, revision bigint not null,
 primary key(owner_id,student_id,id), foreign key(owner_id,student_id) references public.hui_grade_students(owner_id,id)
);
create table if not exists public.hui_grade_operations (
 owner_id uuid not null, student_id text not null, operation_id text not null, body_hash text not null,
 result jsonb not null, created_at timestamptz not null default now(), primary key(owner_id,student_id,operation_id),
 foreign key(owner_id,student_id) references public.hui_grade_students(owner_id,id)
);
alter table public.hui_grade_students enable row level security;
alter table public.hui_grade_workspaces enable row level security;
alter table public.hui_grade_exams enable row level security;
alter table public.hui_grade_plans enable row level security;
alter table public.hui_grade_operations enable row level security;
revoke all on public.hui_grade_students,public.hui_grade_workspaces,public.hui_grade_exams,public.hui_grade_plans,public.hui_grade_operations from public,anon,authenticated;
create or replace function public.hui_grades(actor uuid, action text, student_key text default null, student_name text default null,
 expected_revision bigint default null, operation_key text default null, body_hash text default null, next_values jsonb default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare current_doc hui_grade_workspaces%rowtype; receipt hui_grade_operations%rowtype; answer jsonb; exams jsonb; plans jsonb; entry jsonb;
begin
 -- Serializes creation limits and all workspace writes for this owner. Actor comes only from authenticated server code.
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 if action='students.list' then
  return coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name) order by created_at) from hui_grade_students where owner_id=actor),'[]'::jsonb);
 end if;
 if action='students.create' then
  if not exists(select 1 from hui_grade_students where owner_id=actor and id=student_key) then
   if (select count(*) from hui_grade_students where owner_id=actor)>=20 then return jsonb_build_object('error','最多管理 20 个学生档案','status',409); end if;
   insert into hui_grade_students(owner_id,id,name) values(actor,student_key,student_name);
   insert into hui_grade_workspaces(owner_id,student_id) values(actor,student_key);
  end if;
  return jsonb_build_object('id',student_key,'name',(select name from hui_grade_students where owner_id=actor and id=student_key));
 end if;
 if not exists(select 1 from hui_grade_students where owner_id=actor and id=student_key) then
  return jsonb_build_object('error','学生档案不存在或无访问权限','status',404,'code','NOT_FOUND');
 end if;
 select * into current_doc from hui_grade_workspaces where owner_id=actor and student_id=student_key for update;
 if action='workspace.get' then return jsonb_build_object('revision',current_doc.revision,'values',current_doc.values_json); end if;
 if action<>'workspace.save' then return jsonb_build_object('error','未知操作','status',400); end if;
 select * into receipt from hui_grade_operations where owner_id=actor and student_id=student_key and operation_id=operation_key;
 if found then
  if receipt.body_hash<>body_hash then return jsonb_build_object('error','重复操作的资料不同','status',409); end if;
  return receipt.result;
 end if;
 if current_doc.revision<>expected_revision then
  return jsonb_build_object('conflict',true,'revision',current_doc.revision,'values',current_doc.values_json);
 end if;
 if jsonb_typeof(next_values)<>'object' or octet_length(next_values::text)>1800000 then raise exception 'Invalid grade workspace'; end if;
 exams:=coalesce(next_values->'records','[]'::jsonb);if jsonb_typeof(exams)='string' then exams:=(next_values->>'records')::jsonb; end if;
 plans:=coalesce(next_values->'plans','[]'::jsonb);if jsonb_typeof(plans)='string' then plans:=(next_values->>'plans')::jsonb; end if;
 if jsonb_typeof(exams)<>'array' or jsonb_typeof(plans)<>'array' then raise exception 'Invalid grade entries'; end if;
 -- Deleted entries retain tombstones. Old devices must resolve a revision conflict before replacing a workspace.
 update hui_grade_exams set deleted=true,revision=current_doc.revision+1 where owner_id=actor and student_id=student_key and not deleted;
 for entry in select value from jsonb_array_elements(exams) loop
  insert into hui_grade_exams(owner_id,student_id,id,payload,revision) values(actor,student_key,entry->>'id',entry,current_doc.revision+1)
  on conflict(owner_id,student_id,id) do update set payload=excluded.payload,deleted=false,revision=excluded.revision;
 end loop;
 update hui_grade_plans set deleted=true,revision=current_doc.revision+1 where owner_id=actor and student_id=student_key and not deleted;
 for entry in select value from jsonb_array_elements(plans) loop
  insert into hui_grade_plans(owner_id,student_id,id,payload,revision) values(actor,student_key,entry->>'id',entry,current_doc.revision+1)
  on conflict(owner_id,student_id,id) do update set payload=excluded.payload,deleted=false,revision=excluded.revision;
 end loop;
 update hui_grade_workspaces set values_json=next_values,revision=revision+1,updated_at=now() where owner_id=actor and student_id=student_key;
 answer:=jsonb_build_object('revision',current_doc.revision+1);
 insert into hui_grade_operations(owner_id,student_id,operation_id,body_hash,result) values(actor,student_key,operation_key,body_hash,answer);
 return answer;
end; $$;
revoke all on function public.hui_grades(uuid,text,text,text,bigint,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.hui_grades(uuid,text,text,text,bigint,text,text,jsonb) to service_role;
notify pgrst,'reload schema';
commit;
