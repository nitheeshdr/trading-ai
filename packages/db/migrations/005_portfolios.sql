create table if not exists public.portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  symbol text not null,
  exchange text not null default 'NSE',
  quantity int not null check (quantity >= 0),
  avg_price numeric(12, 2) not null,
  mode text not null check (mode in ('real', 'paper')) default 'paper',
  updated_at timestamptz default now(),
  unique (user_id, symbol, mode)
);

create index portfolios_user_id_idx on public.portfolios(user_id);

create trigger portfolios_updated_at
  before update on public.portfolios
  for each row execute function public.handle_updated_at();

alter table public.portfolios enable row level security;

create policy "Users can view own portfolios"
  on public.portfolios for select using (auth.uid() = user_id);

create policy "Users can insert own portfolios"
  on public.portfolios for insert with check (auth.uid() = user_id);

create policy "Users can update own portfolios"
  on public.portfolios for update using (auth.uid() = user_id);

create policy "Users can delete own portfolios"
  on public.portfolios for delete using (auth.uid() = user_id);
