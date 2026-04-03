create table if not exists public.community_levels (
  id bigint primary key,
  name text not null,
  width integer not null,
  height integer not null,
  grid jsonb not null,
  players jsonb not null,
  lives integer not null default 1,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

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

create table if not exists public.campaign_overrides (
  id bigint primary key,
  name text not null,
  width integer not null,
  height integer not null,
  grid jsonb not null,
  players jsonb not null,
  lives integer not null default 1,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

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
