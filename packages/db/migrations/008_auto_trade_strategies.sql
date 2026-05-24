create table if not exists public.auto_trade_strategies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  symbol text not null,
  exchange text not null default 'NSE',
  enabled boolean default false,
  mode text not null check (mode in ('real', 'paper')) default 'paper',

  -- Entry conditions
  entry_signal text not null check (
    entry_signal in ('AI_BUY', 'PRICE_ABOVE', 'PRICE_BELOW', 'RSI_OVERSOLD', 'RSI_OVERBOUGHT')
  ) default 'AI_BUY',
  entry_price_level numeric(12, 2),          -- for PRICE_ABOVE / PRICE_BELOW
  min_confidence numeric(5, 4) default 0.70 check (min_confidence between 0.60 and 1.0),
  quantity int not null check (quantity > 0),

  -- Exit conditions
  profit_target_pct numeric(6, 2) not null check (profit_target_pct > 0),
  stop_loss_pct numeric(6, 2) not null check (stop_loss_pct > 0),
  trailing_stop boolean default false,
  trailing_stop_pct numeric(6, 2),           -- only if trailing_stop = true
  max_hold_minutes int default 60 check (max_hold_minutes > 0),

  -- Risk controls
  max_daily_trades int default 5 check (max_daily_trades > 0),
  max_daily_loss_pct numeric(6, 2) default 2.0 check (max_daily_loss_pct > 0),

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index auto_trade_strategies_user_id_idx on public.auto_trade_strategies(user_id);
create index auto_trade_strategies_symbol_idx on public.auto_trade_strategies(symbol);

create trigger auto_trade_strategies_updated_at
  before update on public.auto_trade_strategies
  for each row execute function public.handle_updated_at();

alter table public.auto_trade_strategies enable row level security;

create policy "Users can manage own strategies"
  on public.auto_trade_strategies for all using (auth.uid() = user_id);
