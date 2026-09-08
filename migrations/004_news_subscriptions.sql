alter table public.users add column if not exists news_notifications boolean not null default true;
create table if not exists education_news_deliveries (
  news_id uuid not null references education_news(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  delivered_at timestamptz not null default now(),
  primary key(news_id, user_id)
);
alter table public.education_news_deliveries enable row level security;
