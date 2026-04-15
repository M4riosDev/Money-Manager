create table if not exists public.vaults (
  user_id uuid primary key references auth.users(id) on delete cascade,
  budget text not null default '1500',
  expenses jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.vaults enable row level security;

create policy "Users can read own vault"
  on public.vaults
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own vault"
  on public.vaults
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own vault"
  on public.vaults
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own vault"
  on public.vaults
  for delete
  using (auth.uid() = user_id);

create or replace function public.set_vault_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger vaults_set_updated_at
before update on public.vaults
for each row
execute function public.set_vault_updated_at();
