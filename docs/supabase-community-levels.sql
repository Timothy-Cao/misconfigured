create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_profiles_updated_at();

alter table public.profiles enable row level security;

create policy "profiles are readable to authenticated users"
on public.profiles
for select
to authenticated
using (true);

create policy "users can manage their own profile"
on public.profiles
for all
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create sequence if not exists public.community_level_id_seq
  as bigint
  start with 10000
  increment by 1
  minvalue 10000
  no maxvalue
  cache 1;

create table if not exists public.community_levels (
  id bigint primary key default nextval('public.community_level_id_seq'),
  owner_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  width integer not null,
  height integer not null,
  grid jsonb not null,
  players jsonb not null,
  lives integer not null default 1,
  max_moves integer,
  is_published boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint community_levels_owner_required check (owner_id is not null)
);

alter sequence public.community_level_id_seq owned by public.community_levels.id;

alter table public.community_levels
  add column if not exists owner_id uuid references public.profiles(id) on delete cascade,
  add column if not exists is_published boolean not null default false,
  add column if not exists max_moves integer;

update public.community_levels
set is_published = coalesce(is_published, false)
where is_published is null;

create or replace function public.set_community_levels_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists set_community_levels_updated_at on public.community_levels;

create trigger set_community_levels_updated_at
before update on public.community_levels
for each row
execute function public.set_community_levels_updated_at();

alter table public.community_levels enable row level security;

drop policy if exists "published community levels are public" on public.community_levels;
create policy "published community levels are public"
on public.community_levels
for select
to anon, authenticated
using (is_published = true);

drop policy if exists "owners can read their own community levels" on public.community_levels;
create policy "owners can read their own community levels"
on public.community_levels
for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists "owners can insert their own community levels" on public.community_levels;
create policy "owners can insert their own community levels"
on public.community_levels
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "owners can update their own community levels" on public.community_levels;
create policy "owners can update their own community levels"
on public.community_levels
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "owners can delete their own community levels" on public.community_levels;
create policy "owners can delete their own community levels"
on public.community_levels
for delete
to authenticated
using (owner_id = auth.uid());

create table if not exists public.campaign_overrides (
  id bigint primary key,
  source_community_level_id bigint references public.community_levels(id) on delete set null,
  name text not null,
  width integer not null,
  height integer not null,
  grid jsonb not null,
  players jsonb not null,
  lives integer not null default 1,
  max_moves integer,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.campaign_overrides
  add column if not exists source_community_level_id bigint references public.community_levels(id) on delete set null,
  add column if not exists max_moves integer;

create or replace function public.set_campaign_overrides_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists set_campaign_overrides_updated_at on public.campaign_overrides;

create trigger set_campaign_overrides_updated_at
before update on public.campaign_overrides
for each row
execute function public.set_campaign_overrides_updated_at();

alter table public.campaign_overrides enable row level security;

drop policy if exists "campaign overrides are public read" on public.campaign_overrides;
create policy "campaign overrides are public read"
on public.campaign_overrides
for select
to anon, authenticated
using (true);

-- Admin writes can stay server-side through the service role for now.
-- When campaign editing moves fully into authenticated UI flows, add a
-- policy keyed off profiles.is_admin or perform writes in secure server routes.
