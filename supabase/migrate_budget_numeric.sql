alter table public.vaults
  alter column budget type numeric(12, 2)
  using budget::numeric(12, 2);

alter table public.vaults
  alter column budget set default 1500;

alter table public.vaults
  add constraint vaults_budget_non_negative check (budget >= 0);


alter table public.vaults
  add constraint vaults_expenses_is_array
  check (jsonb_typeof(expenses) = 'array');
