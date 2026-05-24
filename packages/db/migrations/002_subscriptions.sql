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
