-- Enable UUID extension
create extension if not exists "pgcrypto";

-- 1. Habits Table
create table if not exists habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  category text,
  created_at timestamp with time zone default now(),
  is_active boolean default true
);

-- RLS for Habits
alter table habits enable row level security;

create policy "Users can view own habits"
on habits for select
using (auth.uid() = user_id);

create policy "Users can insert own habits"
on habits for insert
with check (auth.uid() = user_id);

create policy "Users can update own habits"
on habits for update
using (auth.uid() = user_id);

create policy "Users can delete own habits"
on habits for delete
using (auth.uid() = user_id);


-- 2. Habit Logs (Immutable daily entries)
create table if not exists habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid references habits(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  log_date date not null,
  completed boolean not null,
  completed_at timestamp with time zone,
  failure_reason text,
  mood_score int check (mood_score between 1 and 5),
  sleep_hours numeric(3,1),
  created_at timestamp with time zone default now(),
  unique (habit_id, log_date)
);

-- RLS for Habit Logs
alter table habit_logs enable row level security;

create policy "Users can view own logs"
on habit_logs for select
using (auth.uid() = user_id);

create policy "Users can insert own logs"
on habit_logs for insert
with check (auth.uid() = user_id);

create policy "Users can update own logs"
on habit_logs for update
using (auth.uid() = user_id);


-- 3. Habit Analytics Daily (Precomputed stats)
create table if not exists habit_analytics_daily (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid references habits(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  analytics_date date not null,

  consistency_score int, -- 0-100
  streak_fragility int, -- 0-100
  momentum text check (momentum in ('Improving', 'Stable', 'Declining')),
  momentum_slope numeric(5,3),

  burnout_signal boolean default false,

  created_at timestamp with time zone default now(),
  unique (habit_id, analytics_date)
);

-- RLS for Analytics (Read-only for users, written by Edge Function/Service Role)
alter table habit_analytics_daily enable row level security;

create policy "Users can view own analytics"
on habit_analytics_daily for select
using (auth.uid() = user_id);

-- Note: Insert/Update policies are omitted so only service role can modify.


-- 4. User Burnout Daily (User-level signal)
create table if not exists user_burnout_daily (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  analytics_date date not null,
  risk_level text check (risk_level in ('Low','Medium','High')),
  signals jsonb,
  created_at timestamp with time zone default now(),
  unique (user_id, analytics_date)
);

-- RLS for Burnout Daily
alter table user_burnout_daily enable row level security;

create policy "Users can view own burnout stats"
on user_burnout_daily for select
using (auth.uid() = user_id);


-- 5. Habit Correlations (Weekly precompute)
create table if not exists habit_correlations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  habit_a uuid references habits(id) not null,
  habit_b uuid references habits(id) not null,
  correlation_score numeric(5,3),
  computed_at timestamp with time zone default now(),
  unique (user_id, habit_a, habit_b)
);

-- RLS for Correlations
alter table habit_correlations enable row level security;

create policy "Users can view own correlations"
on habit_correlations for select
using (auth.uid() = user_id);


-- Indexes for Performance
create index if not exists idx_habit_logs_user_date on habit_logs(user_id, log_date);
create index if not exists idx_analytics_user_date on habit_analytics_daily(user_id, analytics_date);
create index if not exists idx_burnout_user_date on user_burnout_daily(user_id, analytics_date);
