create table if not exists public.vaults (
  user_id uuid primary key references auth.users(id) on delete cascade,
  budget numeric(12,2) not null default 1500,
  savings numeric(12,2) not null default 0,
  monthly_income numeric(12,2) not null default 0,
  currency text not null default 'EUR',
  expenses jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.vaults
  add column if not exists currency text;

alter table public.vaults
  alter column budget type numeric(12,2)
  using budget::numeric(12,2);

alter table public.vaults
  alter column savings type numeric(12,2)
  using savings::numeric(12,2);

alter table public.vaults
  alter column monthly_income type numeric(12,2)
  using monthly_income::numeric(12,2);

alter table public.vaults
  alter column budget set default 1500;

alter table public.vaults
  alter column savings set default 0;

alter table public.vaults
  alter column monthly_income set default 0;

update public.vaults
set monthly_income = coalesce(monthly_income, 0)
where monthly_income is null;

update public.vaults
set currency = upper(trim(coalesce(currency, 'EUR')))
where currency is null
  or trim(currency) = ''
  or upper(trim(currency)) not in ('EUR','USD','GBP','CHF','AUD','CAD','JPY','BGN','RON');

alter table public.vaults
  alter column currency set default 'EUR';

alter table public.vaults
  alter column currency set not null;

alter table public.vaults
  drop constraint if exists vaults_budget_non_negative;

alter table public.vaults
  add constraint vaults_budget_non_negative check (budget >= 0);

alter table public.vaults
  drop constraint if exists vaults_savings_non_negative;

alter table public.vaults
  add constraint vaults_savings_non_negative check (savings >= 0);

alter table public.vaults
  drop constraint if exists vaults_monthly_income_non_negative;

alter table public.vaults
  add constraint vaults_monthly_income_non_negative check (monthly_income >= 0);

alter table public.vaults
  drop constraint if exists vaults_currency_allowed;

alter table public.vaults
  add constraint vaults_currency_allowed
  check (currency in ('EUR','USD','GBP','CHF','AUD','CAD','JPY','BGN','RON'));

alter table public.vaults
  drop constraint if exists vaults_expenses_is_array;

alter table public.vaults
  add constraint vaults_expenses_is_array check (jsonb_typeof(expenses) = 'array');

alter table public.vaults enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.vaults to authenticated;
revoke all on public.vaults from anon;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'vaults'
      and policyname = 'Users can read own vault'
  ) then
    create policy "Users can read own vault"
      on public.vaults
      for select
      using (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'vaults'
      and policyname = 'Users can insert own vault'
  ) then
    create policy "Users can insert own vault"
      on public.vaults
      for insert
      with check (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'vaults'
      and policyname = 'Users can update own vault'
  ) then
    create policy "Users can update own vault"
      on public.vaults
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'vaults'
      and policyname = 'Users can delete own vault'
  ) then
    create policy "Users can delete own vault"
      on public.vaults
      for delete
      using (auth.uid() = user_id);
  end if;
end
$$;

create or replace function public.set_vault_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists vaults_set_updated_at on public.vaults;

create trigger vaults_set_updated_at
before update on public.vaults
for each row
execute function public.set_vault_updated_at();
