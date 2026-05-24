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
