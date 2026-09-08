create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  telegram_user_id bigint unique not null,
  username text,
  first_name text,
  last_name text,
  is_blocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists branches (
  id uuid primary key default gen_random_uuid(), name text unique not null,
  is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists subjects (
  id uuid primary key default gen_random_uuid(), branch_id uuid not null references branches(id) on delete cascade,
  name text not null, is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(branch_id,name)
);
create table if not exists academic_years (id uuid primary key default gen_random_uuid(), year integer unique not null, created_at timestamptz not null default now());
create table if not exists rounds (id uuid primary key default gen_random_uuid(), name text unique not null, created_at timestamptz not null default now());
create table if not exists files (
  id uuid primary key default gen_random_uuid(), kind text not null check(kind in ('manhaj','ministerial')),
  title text not null, description text, branch_id uuid not null references branches(id), subject_id uuid not null references subjects(id),
  year_id uuid references academic_years(id), round_id uuid references rounds(id), file_path text not null,
  telegram_file_id text, file_type text not null default 'application/pdf', file_size bigint, download_count integer not null default 0,
  is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists favorites (
  user_id uuid not null references users(id) on delete cascade, file_id uuid not null references files(id) on delete cascade,
  created_at timestamptz not null default now(), primary key(user_id,file_id)
);
create index if not exists files_search_idx on files using gin(to_tsvector('simple', title));
create index if not exists files_branch_subject_idx on files(branch_id,subject_id,kind,is_active);
create index if not exists favorites_user_idx on favorites(user_id);
insert into branches(name) values ('السادس العلمي'), ('السادس الأدبي') on conflict (name) do nothing;
insert into rounds(name) values ('الدور الأول'), ('الدور الثاني'), ('الدور الثالث') on conflict (name) do nothing;
