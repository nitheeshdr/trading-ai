create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  symbol text not null,
  exchange text not null default 'NSE',    -- 'NSE' | 'BSE' | 'NFO'
  type text not null check (type in ('BUY', 'SELL')),
  quantity int not null check (quantity > 0),
  price numeric(12, 2) not null,
  mode text not null check (mode in ('real', 'paper')) default 'paper',
  broker_order_id text,
  strategy_id uuid,                        -- null = manual trade
  executed_at timestamptz default now()
);

create index trades_user_id_idx on public.trades(user_id);
create index trades_symbol_idx on public.trades(symbol);
create index trades_executed_at_idx on public.trades(executed_at desc);

alter table public.trades enable row level security;

create policy "Users can view own trades"
  on public.trades for select using (auth.uid() = user_id);

create policy "Users can insert own trades"
  on public.trades for insert with check (auth.uid() = user_id);
