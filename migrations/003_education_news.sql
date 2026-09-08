create table if not exists education_news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  source_url text unique not null,
  source_name text not null default 'وزارة التربية العراقية',
  published_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists education_news_published_idx on education_news(is_active, published_at desc);
alter table public.education_news enable row level security;
