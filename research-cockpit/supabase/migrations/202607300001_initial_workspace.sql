create extension if not exists pgcrypto;

create type public.member_role as enum ('admin', 'member');
create type public.member_status as enum ('pending', 'approved', 'suspended');
create type public.access_request_status as enum ('pending', 'approved', 'rejected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  github_username text,
  display_name text,
  role public.member_role not null default 'member',
  status public.member_status not null default 'pending',
  approved_at timestamptz,
  approved_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (email),
  unique (github_username)
);

create table public.access_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  github_username text,
  message text,
  status public.access_request_status not null default 'pending',
  source text not null default 'homepage',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.admin_audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id),
  action text not null,
  target_table text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'active',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  meta text,
  tag text,
  done boolean not null default false,
  due_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.papers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  venue text,
  status text not null default 'to_read',
  progress integer not null default 0 check (progress between 0 and 100),
  tags text[] not null default '{}',
  note text,
  url text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.paper_projects (
  paper_id uuid not null references public.papers(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  primary key (paper_id, project_id)
);

create table public.experiments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  code text,
  name text not null,
  status text not null default 'queued',
  metric text,
  change text,
  progress integer not null default 0 check (progress between 0 and 100),
  eta text,
  seed text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.artifacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  experiment_id uuid references public.experiments(id) on delete set null,
  type text not null,
  title text not null,
  url text not null check (url ~* '^https?://'),
  meta text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.learning_phases (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  description text,
  sort_order integer not null default 0,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  started_at timestamptz not null,
  ended_at timestamptz,
  minutes integer check (minutes >= 0),
  notes text,
  created_at timestamptz not null default now()
);

create table public.research_notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  body text,
  tags text[] not null default '{}',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and status = 'approved'
  );
$$;

create or replace function public.is_approved_member()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and status = 'approved'
  );
$$;

create trigger profiles_touch_updated_at before update on public.profiles for each row execute function public.touch_updated_at();
create trigger projects_touch_updated_at before update on public.projects for each row execute function public.touch_updated_at();
create trigger tasks_touch_updated_at before update on public.tasks for each row execute function public.touch_updated_at();
create trigger papers_touch_updated_at before update on public.papers for each row execute function public.touch_updated_at();
create trigger experiments_touch_updated_at before update on public.experiments for each row execute function public.touch_updated_at();
create trigger artifacts_touch_updated_at before update on public.artifacts for each row execute function public.touch_updated_at();
create trigger learning_phases_touch_updated_at before update on public.learning_phases for each row execute function public.touch_updated_at();
create trigger research_notes_touch_updated_at before update on public.research_notes for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.access_requests enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.papers enable row level security;
alter table public.paper_projects enable row level security;
alter table public.experiments enable row level security;
alter table public.artifacts enable row level security;
alter table public.learning_phases enable row level security;
alter table public.study_sessions enable row level security;
alter table public.research_notes enable row level security;

create policy "profiles can read own row" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles can insert own row" on public.profiles
  for insert with check (
    id = auth.uid()
    and (
      (
        lower(email) = 'lyin01864@gmail.com'
        and lower(github_username) = 'lgy123321lgy'
        and role = 'admin'
        and status = 'approved'
      )
      or (
        role = 'member'
        and status = 'pending'
      )
    )
  );
create policy "admins can update profiles" on public.profiles for update using (public.is_admin()) with check (public.is_admin());
create policy "first admin can refresh own profile" on public.profiles
  for update using (
    id = auth.uid()
    and lower(email) = 'lyin01864@gmail.com'
    and lower(github_username) = 'lgy123321lgy'
  ) with check (
    id = auth.uid()
    and lower(email) = 'lyin01864@gmail.com'
    and lower(github_username) = 'lgy123321lgy'
    and role = 'admin'
    and status = 'approved'
  );

create policy "anyone can request access" on public.access_requests for insert with check (true);
create policy "admins can manage access requests" on public.access_requests for all using (public.is_admin()) with check (public.is_admin());

create policy "admins can read audit logs" on public.admin_audit_logs for select using (public.is_admin());
create policy "admins can write audit logs" on public.admin_audit_logs for insert with check (public.is_admin());

create policy "project owners crud" on public.projects for all using (owner_id = auth.uid() and public.is_approved_member()) with check (owner_id = auth.uid() and public.is_approved_member());
create policy "task owners crud" on public.tasks for all using (owner_id = auth.uid() and public.is_approved_member()) with check (owner_id = auth.uid() and public.is_approved_member());
create policy "paper owners crud" on public.papers for all using (owner_id = auth.uid() and public.is_approved_member()) with check (owner_id = auth.uid() and public.is_approved_member());
create policy "experiment owners crud" on public.experiments for all using (owner_id = auth.uid() and public.is_approved_member()) with check (owner_id = auth.uid() and public.is_approved_member());
create policy "artifact owners crud" on public.artifacts for all using (owner_id = auth.uid() and public.is_approved_member()) with check (owner_id = auth.uid() and public.is_approved_member());
create policy "learning phase owners crud" on public.learning_phases for all using (owner_id = auth.uid() and public.is_approved_member()) with check (owner_id = auth.uid() and public.is_approved_member());
create policy "study session owners crud" on public.study_sessions for all using (owner_id = auth.uid() and public.is_approved_member()) with check (owner_id = auth.uid() and public.is_approved_member());
create policy "research note owners crud" on public.research_notes for all using (owner_id = auth.uid() and public.is_approved_member()) with check (owner_id = auth.uid() and public.is_approved_member());

create policy "paper project owners read" on public.paper_projects
  for select using (
    exists (select 1 from public.papers where papers.id = paper_id and papers.owner_id = auth.uid())
  );
create policy "paper project owners write" on public.paper_projects
  for all using (
    exists (select 1 from public.papers where papers.id = paper_id and papers.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.papers where papers.id = paper_id and papers.owner_id = auth.uid())
  );
