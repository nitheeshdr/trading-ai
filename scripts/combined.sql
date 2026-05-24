-- TradeView: Combined Migrations
-- Run this in Supabase SQL Editor → https://supabase.com/dashboard/project/wkffqedsboeenmmfwkfq/sql/new

-- ═══════════════════════════════════════
-- 001_users.sql
-- ═══════════════════════════════════════
-- Users table (extends Supabase auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  avatar_url text,
  broker_connected boolean default false,
  broker_name text,                          -- 'kite' | 'upstox' | 'angel'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at
  before update on public.users
  for each row execute function public.handle_updated_at();

-- Row-level security
alter table public.users enable row level security;

create policy "Users can view own profile"
  on public.users for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update using (auth.uid() = id);

-- Auto-create user row on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ═══════════════════════════════════════
-- 002_subscriptions.sql
-- ═══════════════════════════════════════
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  plan text not null check (plan in ('free', 'pro', 'elite')) default 'free',
  status text not null check (status in ('active', 'cancelled', 'expired')) default 'active',
  started_at timestamptz default now(),
  expires_at timestamptz,
  payment_id text,
  created_at timestamptz default now()
);

alter table public.subscriptions enable row level security;

create policy "Users can view own subscription"
  on public.subscriptions for select using (auth.uid() = user_id);

-- ═══════════════════════════════════════
-- 003_trades.sql
-- ═══════════════════════════════════════
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

-- ═══════════════════════════════════════
-- 004_watchlists.sql
-- ═══════════════════════════════════════
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

-- ═══════════════════════════════════════
-- 005_portfolios.sql
-- ═══════════════════════════════════════
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

-- ═══════════════════════════════════════
-- 006_alerts.sql
-- ═══════════════════════════════════════
create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  symbol text not null,
  exchange text not null default 'NSE',
  condition text not null check (condition in ('above', 'below')),
  price numeric(12, 2) not null,
  triggered boolean default false,
  triggered_at timestamptz,
  notify_email boolean default false,
  created_at timestamptz default now()
);

create index alerts_user_id_idx on public.alerts(user_id);
create index alerts_symbol_idx on public.alerts(symbol);

alter table public.alerts enable row level security;

create policy "Users can view own alerts"
  on public.alerts for select using (auth.uid() = user_id);

create policy "Users can insert own alerts"
  on public.alerts for insert with check (auth.uid() = user_id);

create policy "Users can update own alerts"
  on public.alerts for update using (auth.uid() = user_id);

create policy "Users can delete own alerts"
  on public.alerts for delete using (auth.uid() = user_id);

-- ═══════════════════════════════════════
-- 007_ai_logs.sql
-- ═══════════════════════════════════════
create table if not exists public.ai_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  symbol text not null,
  exchange text not null default 'NSE',
  model_type text not null check (model_type in ('xgboost', 'lightgbm', 'lstm', 'transformer', 'cnn', 'finbert')),
  signal text not null check (signal in ('BUY', 'SELL', 'HOLD')),
  confidence numeric(5, 4) not null check (confidence between 0 and 1),
  timeframe text,                            -- '1m' | '5m' | '15m' | '1h' | '1d'
  metadata jsonb,                            -- raw model output, features used
  created_at timestamptz default now()
);

create index ai_logs_symbol_idx on public.ai_logs(symbol);
create index ai_logs_created_at_idx on public.ai_logs(created_at desc);
create index ai_logs_user_id_idx on public.ai_logs(user_id);

alter table public.ai_logs enable row level security;

create policy "Users can view own AI logs"
  on public.ai_logs for select using (auth.uid() = user_id);

-- ═══════════════════════════════════════
-- 008_auto_trade_strategies.sql
-- ═══════════════════════════════════════
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

-- ═══════════════════════════════════════
-- 009_auto_trade_executions.sql
-- ═══════════════════════════════════════
create table if not exists public.auto_trade_executions (
  id uuid primary key default gen_random_uuid(),
  strategy_id uuid not null references public.auto_trade_strategies(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  symbol text not null,
  exchange text not null default 'NSE',

  -- Trade details
  side text not null check (side in ('BUY', 'SELL')),
  quantity int not null check (quantity > 0),
  entry_price numeric(12, 2),
  exit_price numeric(12, 2),
  profit_loss numeric(12, 2),
  profit_loss_pct numeric(6, 2),

  -- Exit metadata
  exit_reason text check (exit_reason in (
    'PROFIT_TARGET', 'STOP_LOSS', 'TRAILING_STOP',
    'TIME_EXIT', 'MANUAL', 'AI_REVERSAL'
  )),
  status text not null check (status in ('OPEN', 'CLOSED', 'CANCELLED')) default 'OPEN',

  -- Broker
  broker_order_id text,
  mode text not null check (mode in ('real', 'paper')) default 'paper',

  -- AI context
  ai_signal_confidence numeric(5, 4),
  ai_model_type text,

  -- Timestamps
  entered_at timestamptz default now(),
  exited_at timestamptz,

  metadata jsonb
);

create index auto_trade_executions_strategy_id_idx on public.auto_trade_executions(strategy_id);
create index auto_trade_executions_user_id_idx on public.auto_trade_executions(user_id);
create index auto_trade_executions_status_idx on public.auto_trade_executions(status);
create index auto_trade_executions_entered_at_idx on public.auto_trade_executions(entered_at desc);

alter table public.auto_trade_executions enable row level security;

create policy "Users can view own executions"
  on public.auto_trade_executions for select using (auth.uid() = user_id);

create policy "Users can insert own executions"
  on public.auto_trade_executions for insert with check (auth.uid() = user_id);

create policy "Users can update own executions"
  on public.auto_trade_executions for update using (auth.uid() = user_id);

