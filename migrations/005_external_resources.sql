create table if not exists external_resources (
  id uuid primary key default gen_random_uuid(),
  category text not null check(category in ('resource','ministerial')),
  branch_id uuid references branches(id) on delete set null,
  subject_id uuid references subjects(id) on delete set null,
  year integer,
  round text,
  title text not null,
  description text,
  url text unique not null,
  source_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists external_resources_filter_idx on external_resources(category, branch_id, year, is_active);
alter table public.external_resources enable row level security;
