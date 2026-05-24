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
