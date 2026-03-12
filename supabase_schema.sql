-- Family Dues Tracker (Supabase) - Core Schema + Security (RLS) + Admin allowlist
-- Generated: 2026-03-11
--
-- What this schema provides:
-- 1) Supabase Auth signups create a profile row automatically.
-- 2) Admin allowlist: mcphyltetteh@gmail.com is assigned role='admin' on signup.
-- 3) Members register (self signup) but must be ADMIN-APPROVED to link to a member record.
-- 4) Row Level Security ensures members only see their own contributions.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'member' check (role in ('member','admin')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_email text;
  v_role  text;
begin
  v_email := lower(coalesce(new.email, ''));

  v_role := case
    when v_email = 'mcphyltetteh@gmail.com' then 'admin'
    else 'member'
  end;

  insert into public.profiles(id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), v_role)
  on conflict (id) do update
    set full_name = excluded.full_name,
        role      = excluded.role;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  member_name text not null unique,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now()
);

create table if not exists public.link_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  requested_name text,
  note text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references auth.users(id)
);

create index if not exists idx_link_requests_user_id on public.link_requests(user_id);
create index if not exists idx_link_requests_status on public.link_requests(status);

create table if not exists public.member_links (
  user_id uuid primary key references auth.users(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  approved boolean not null default true,
  approved_by uuid references auth.users(id),
  approved_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_member_links_member_id on public.member_links(member_id);

create table if not exists public.contributions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  amount numeric(12,2) not null check (amount >= 0),
  date_paid date not null,
  month int not null check (month between 1 and 12),
  year int not null check (year between 2000 and 2100),
  payment_method text,
  remarks text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_contrib_member_year_month on public.contributions(member_id, year, month);
create index if not exists idx_contrib_date_paid on public.contributions(date_paid);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_contrib_updated_at on public.contributions;
create trigger set_contrib_updated_at
before update on public.contributions
for each row execute procedure public.set_updated_at();

create or replace function public.is_admin()
returns boolean as $$
  select exists(
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$ language sql stable;

alter table public.profiles enable row level security;
alter table public.members enable row level security;
alter table public.link_requests enable row level security;
alter table public.member_links enable row level security;
alter table public.contributions enable row level security;

create policy "profiles_select_own_or_admin" on public.profiles
for select using (id = auth.uid() or public.is_admin());

create policy "profiles_update_own" on public.profiles
for update using (id = auth.uid());

create policy "members_admin_all" on public.members
for all using (public.is_admin()) with check (public.is_admin());

create policy "members_select_linked" on public.members
for select using (
  public.is_admin() or
  exists(
    select 1 from public.member_links ml
    where ml.user_id = auth.uid() and ml.member_id = members.id
  )
);

create policy "link_requests_insert_own" on public.link_requests
for insert with check (user_id = auth.uid());

create policy "link_requests_select_own_or_admin" on public.link_requests
for select using (user_id = auth.uid() or public.is_admin());

create policy "link_requests_admin_update" on public.link_requests
for update using (public.is_admin()) with check (public.is_admin());

create policy "member_links_select_own_or_admin" on public.member_links
for select using (user_id = auth.uid() or public.is_admin());

create policy "member_links_admin_insert" on public.member_links
for insert with check (public.is_admin());

create policy "member_links_admin_update" on public.member_links
for update using (public.is_admin()) with check (public.is_admin());

create policy "contrib_admin_all" on public.contributions
for all using (public.is_admin()) with check (public.is_admin());

create policy "contrib_select_own" on public.contributions
for select using (
  public.is_admin() or
  exists(
    select 1 from public.member_links ml
    where ml.user_id = auth.uid() and ml.member_id = contributions.member_id
  )
);
