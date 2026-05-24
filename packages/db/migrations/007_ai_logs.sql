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
