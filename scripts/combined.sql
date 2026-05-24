-- TradeView: Combined Migrations (type-safe)
-- Paste this in: https://supabase.com/dashboard/project/wkffqedsboeenmmfwkfq/sql/new

-- ══════════════════════════════════════════════════════════
-- 000 CLEAN SLATE (drop everything in reverse dep order)
-- ══════════════════════════════════════════════════════════
drop table if exists public.auto_trade_executions cascade;
drop table if exists public.auto_trade_strategies cascade;
drop table if exists public.ai_logs cascade;
drop table if exists public.alerts cascade;
drop table if exists public.portfolios cascade;
drop table if exists public.watchlists cascade;
drop table if exists public.trades cascade;
drop table if exists public.subscriptions cascade;
drop table if exists public.users cascade;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.handle_updated_at() cascade;

-- ══════════════════════════════════════════════════════════
-- 001 USERS
-- ══════════════════════════════════════════════════════════
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  avatar_url text,
  broker_connected boolean default false,
  broker_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_updated_at on public.users;
create trigger users_updated_at
  before update on public.users
  for each row execute function public.handle_updated_at();

alter table public.users enable row level security;

drop policy if exists "Users can view own profile" on public.users;
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid()::text = id::text);

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
  on public.users for update
  using (auth.uid()::text = id::text);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ══════════════════════════════════════════════════════════
-- 002 SUBSCRIPTIONS
-- ══════════════════════════════════════════════════════════
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  plan text not null check (plan in ('free','pro','elite')) default 'free',
  status text not null check (status in ('active','cancelled','expired')) default 'active',
  started_at timestamptz default now(),
  expires_at timestamptz,
  payment_id text,
  created_at timestamptz default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists "Users can view own subscription" on public.subscriptions;
create policy "Users can view own subscription"
  on public.subscriptions for select
  using (auth.uid()::text = user_id::text);

-- ══════════════════════════════════════════════════════════
-- 003 TRADES
-- ══════════════════════════════════════════════════════════
create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  symbol text not null,
  exchange text not null default 'NSE',
  type text not null check (type in ('BUY','SELL')),
  quantity int not null check (quantity > 0),
  price numeric(12,2) not null,
  mode text not null check (mode in ('real','paper')) default 'paper',
  broker_order_id text,
  strategy_id uuid,
  executed_at timestamptz default now()
);

create index if not exists trades_user_id_idx on public.trades(user_id);
create index if not exists trades_symbol_idx on public.trades(symbol);
create index if not exists trades_executed_at_idx on public.trades(executed_at desc);

alter table public.trades enable row level security;

drop policy if exists "Users can view own trades" on public.trades;
create policy "Users can view own trades"
  on public.trades for select
  using (auth.uid()::text = user_id::text);

drop policy if exists "Users can insert own trades" on public.trades;
create policy "Users can insert own trades"
  on public.trades for insert
  with check (auth.uid()::text = user_id::text);

-- ══════════════════════════════════════════════════════════
-- 004 WATCHLISTS
-- ══════════════════════════════════════════════════════════
create table if not exists public.watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null default 'My Watchlist',
  symbols text[] not null default '{}',
  is_default boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists watchlists_user_id_idx on public.watchlists(user_id);

drop trigger if exists watchlists_updated_at on public.watchlists;
create trigger watchlists_updated_at
  before update on public.watchlists
  for each row execute function public.handle_updated_at();

alter table public.watchlists enable row level security;

drop policy if exists "Users can view own watchlists" on public.watchlists;
create policy "Users can view own watchlists"
  on public.watchlists for select
  using (auth.uid()::text = user_id::text);

drop policy if exists "Users can insert own watchlists" on public.watchlists;
create policy "Users can insert own watchlists"
  on public.watchlists for insert
  with check (auth.uid()::text = user_id::text);

drop policy if exists "Users can update own watchlists" on public.watchlists;
create policy "Users can update own watchlists"
  on public.watchlists for update
  using (auth.uid()::text = user_id::text);

drop policy if exists "Users can delete own watchlists" on public.watchlists;
create policy "Users can delete own watchlists"
  on public.watchlists for delete
  using (auth.uid()::text = user_id::text);

-- ══════════════════════════════════════════════════════════
-- 005 PORTFOLIOS
-- ══════════════════════════════════════════════════════════
create table if not exists public.portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  symbol text not null,
  exchange text not null default 'NSE',
  quantity int not null check (quantity >= 0),
  avg_price numeric(12,2) not null,
  mode text not null check (mode in ('real','paper')) default 'paper',
  updated_at timestamptz default now(),
  unique (user_id, symbol, mode)
);

create index if not exists portfolios_user_id_idx on public.portfolios(user_id);

drop trigger if exists portfolios_updated_at on public.portfolios;
create trigger portfolios_updated_at
  before update on public.portfolios
  for each row execute function public.handle_updated_at();

alter table public.portfolios enable row level security;

drop policy if exists "Users can view own portfolios" on public.portfolios;
create policy "Users can view own portfolios"
  on public.portfolios for select
  using (auth.uid()::text = user_id::text);

drop policy if exists "Users can insert own portfolios" on public.portfolios;
create policy "Users can insert own portfolios"
  on public.portfolios for insert
  with check (auth.uid()::text = user_id::text);

drop policy if exists "Users can update own portfolios" on public.portfolios;
create policy "Users can update own portfolios"
  on public.portfolios for update
  using (auth.uid()::text = user_id::text);

drop policy if exists "Users can delete own portfolios" on public.portfolios;
create policy "Users can delete own portfolios"
  on public.portfolios for delete
  using (auth.uid()::text = user_id::text);

-- ══════════════════════════════════════════════════════════
-- 006 ALERTS
-- ══════════════════════════════════════════════════════════
create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  symbol text not null,
  exchange text not null default 'NSE',
  condition text not null check (condition in ('above','below')),
  price numeric(12,2) not null,
  triggered boolean default false,
  triggered_at timestamptz,
  notify_email boolean default false,
  created_at timestamptz default now()
);

create index if not exists alerts_user_id_idx on public.alerts(user_id);
create index if not exists alerts_symbol_idx on public.alerts(symbol);

alter table public.alerts enable row level security;

drop policy if exists "Users can view own alerts" on public.alerts;
create policy "Users can view own alerts"
  on public.alerts for select
  using (auth.uid()::text = user_id::text);

drop policy if exists "Users can insert own alerts" on public.alerts;
create policy "Users can insert own alerts"
  on public.alerts for insert
  with check (auth.uid()::text = user_id::text);

drop policy if exists "Users can update own alerts" on public.alerts;
create policy "Users can update own alerts"
  on public.alerts for update
  using (auth.uid()::text = user_id::text);

drop policy if exists "Users can delete own alerts" on public.alerts;
create policy "Users can delete own alerts"
  on public.alerts for delete
  using (auth.uid()::text = user_id::text);

-- ══════════════════════════════════════════════════════════
-- 007 AI LOGS
-- ══════════════════════════════════════════════════════════
create table if not exists public.ai_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  symbol text not null,
  exchange text not null default 'NSE',
  model_type text not null check (model_type in ('xgboost','lightgbm','lstm','transformer','cnn','finbert')),
  signal text not null check (signal in ('BUY','SELL','HOLD')),
  confidence numeric(5,4) not null check (confidence between 0 and 1),
  timeframe text,
  metadata jsonb,
  created_at timestamptz default now()
);

create index if not exists ai_logs_symbol_idx on public.ai_logs(symbol);
create index if not exists ai_logs_created_at_idx on public.ai_logs(created_at desc);
create index if not exists ai_logs_user_id_idx on public.ai_logs(user_id);

alter table public.ai_logs enable row level security;

drop policy if exists "Users can view own AI logs" on public.ai_logs;
create policy "Users can view own AI logs"
  on public.ai_logs for select
  using (auth.uid()::text = user_id::text);

-- ══════════════════════════════════════════════════════════
-- 008 AUTO TRADE STRATEGIES
-- ══════════════════════════════════════════════════════════
create table if not exists public.auto_trade_strategies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  symbol text not null,
  exchange text not null default 'NSE',
  enabled boolean default false,
  mode text not null check (mode in ('real','paper')) default 'paper',
  entry_signal text not null check (
    entry_signal in ('AI_BUY','PRICE_ABOVE','PRICE_BELOW','RSI_OVERSOLD','RSI_OVERBOUGHT')
  ) default 'AI_BUY',
  entry_price_level numeric(12,2),
  min_confidence numeric(5,4) default 0.70 check (min_confidence between 0.60 and 1.0),
  quantity int not null check (quantity > 0),
  profit_target_pct numeric(6,2) not null check (profit_target_pct > 0),
  stop_loss_pct numeric(6,2) not null check (stop_loss_pct > 0),
  trailing_stop boolean default false,
  trailing_stop_pct numeric(6,2),
  max_hold_minutes int default 60 check (max_hold_minutes > 0),
  max_daily_trades int default 5 check (max_daily_trades > 0),
  max_daily_loss_pct numeric(6,2) default 2.0 check (max_daily_loss_pct > 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists auto_trade_strategies_user_id_idx on public.auto_trade_strategies(user_id);
create index if not exists auto_trade_strategies_symbol_idx on public.auto_trade_strategies(symbol);

drop trigger if exists auto_trade_strategies_updated_at on public.auto_trade_strategies;
create trigger auto_trade_strategies_updated_at
  before update on public.auto_trade_strategies
  for each row execute function public.handle_updated_at();

alter table public.auto_trade_strategies enable row level security;

drop policy if exists "Users can manage own strategies" on public.auto_trade_strategies;
create policy "Users can manage own strategies"
  on public.auto_trade_strategies for all
  using (auth.uid()::text = user_id::text);

-- ══════════════════════════════════════════════════════════
-- 009 AUTO TRADE EXECUTIONS
-- ══════════════════════════════════════════════════════════
create table if not exists public.auto_trade_executions (
  id uuid primary key default gen_random_uuid(),
  strategy_id uuid not null references public.auto_trade_strategies(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  symbol text not null,
  exchange text not null default 'NSE',
  side text not null check (side in ('BUY','SELL')),
  quantity int not null check (quantity > 0),
  entry_price numeric(12,2),
  exit_price numeric(12,2),
  profit_loss numeric(12,2),
  profit_loss_pct numeric(6,2),
  exit_reason text check (exit_reason in (
    'PROFIT_TARGET','STOP_LOSS','TRAILING_STOP','TIME_EXIT','MANUAL','AI_REVERSAL'
  )),
  status text not null check (status in ('OPEN','CLOSED','CANCELLED')) default 'OPEN',
  broker_order_id text,
  mode text not null check (mode in ('real','paper')) default 'paper',
  ai_signal_confidence numeric(5,4),
  ai_model_type text,
  entered_at timestamptz default now(),
  exited_at timestamptz,
  metadata jsonb
);

create index if not exists auto_trade_executions_strategy_id_idx on public.auto_trade_executions(strategy_id);
create index if not exists auto_trade_executions_user_id_idx on public.auto_trade_executions(user_id);
create index if not exists auto_trade_executions_status_idx on public.auto_trade_executions(status);
create index if not exists auto_trade_executions_entered_at_idx on public.auto_trade_executions(entered_at desc);

alter table public.auto_trade_executions enable row level security;

drop policy if exists "Users can view own executions" on public.auto_trade_executions;
create policy "Users can view own executions"
  on public.auto_trade_executions for select
  using (auth.uid()::text = user_id::text);

drop policy if exists "Users can insert own executions" on public.auto_trade_executions;
create policy "Users can insert own executions"
  on public.auto_trade_executions for insert
  with check (auth.uid()::text = user_id::text);

drop policy if exists "Users can update own executions" on public.auto_trade_executions;
create policy "Users can update own executions"
  on public.auto_trade_executions for update
  using (auth.uid()::text = user_id::text);

-- ══════════════════════════════════════════════════════════
-- DONE ✅
-- ══════════════════════════════════════════════════════════
