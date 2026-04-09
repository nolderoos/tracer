-- Tracer: flows, folders, and revision history

-- Folders
create table public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Flows
create table public.flows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  folder_id uuid references public.folders(id) on delete set null,
  name text not null default 'Untitled flow',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Flow revisions (append-only version history)
create table public.flow_revisions (
  id uuid primary key default gen_random_uuid(),
  flow_id uuid not null references public.flows(id) on delete cascade,
  revision_number integer not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  unique (flow_id, revision_number)
);

-- Indexes
create index idx_folders_user_id on public.folders(user_id);
create index idx_flows_user_id on public.flows(user_id);
create index idx_flows_folder_id on public.flows(folder_id);
create index idx_flow_revisions_flow_id on public.flow_revisions(flow_id);
create index idx_flow_revisions_latest on public.flow_revisions(flow_id, revision_number desc);

-- Row Level Security
alter table public.folders enable row level security;
alter table public.flows enable row level security;
alter table public.flow_revisions enable row level security;

-- Folders policies
create policy "Users can view own folders"
  on public.folders for select using (auth.uid() = user_id);
create policy "Users can create own folders"
  on public.folders for insert with check (auth.uid() = user_id);
create policy "Users can update own folders"
  on public.folders for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own folders"
  on public.folders for delete using (auth.uid() = user_id);

-- Flows policies
create policy "Users can view own flows"
  on public.flows for select using (auth.uid() = user_id);
create policy "Users can create own flows"
  on public.flows for insert with check (auth.uid() = user_id);
create policy "Users can update own flows"
  on public.flows for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own flows"
  on public.flows for delete using (auth.uid() = user_id);

-- Flow revisions policies (access through flow ownership)
create policy "Users can view own flow revisions"
  on public.flow_revisions for select
  using (exists (select 1 from public.flows where flows.id = flow_revisions.flow_id and flows.user_id = auth.uid()));
create policy "Users can create revisions for own flows"
  on public.flow_revisions for insert
  with check (exists (select 1 from public.flows where flows.id = flow_revisions.flow_id and flows.user_id = auth.uid()));
create policy "Users can delete revisions for own flows"
  on public.flow_revisions for delete
  using (exists (select 1 from public.flows where flows.id = flow_revisions.flow_id and flows.user_id = auth.uid()));

-- Auto-update updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_folders_updated
  before update on public.folders
  for each row execute function public.handle_updated_at();

create trigger on_flows_updated
  before update on public.flows
  for each row execute function public.handle_updated_at();
