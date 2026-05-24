create table if not exists public.watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null default 'My Watchlist',
  symbols text[] not null default '{}',
  is_default boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index watchlists_user_id_idx on public.watchlists(user_id);

create trigger watchlists_updated_at
  before update on public.watchlists
  for each row execute function public.handle_updated_at();

alter table public.watchlists enable row level security;

create policy "Users can view own watchlists"
  on public.watchlists for select using (auth.uid() = user_id);

create policy "Users can insert own watchlists"
  on public.watchlists for insert with check (auth.uid() = user_id);

create policy "Users can update own watchlists"
  on public.watchlists for update using (auth.uid() = user_id);

create policy "Users can delete own watchlists"
  on public.watchlists for delete using (auth.uid() = user_id);
