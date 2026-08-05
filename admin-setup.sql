-- CODE DETECTIVE ADMIN SETUP
-- Run this once in Supabase > SQL Editor.

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;

-- Server-side role check. The browser never decides whether a user is an admin.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Admin-safe user listing. Passwords, password hashes and auth tokens are NEVER returned.
create or replace function public.admin_list_users()
returns table (
  id uuid, email text, created_at timestamptz, last_sign_in_at timestamptz,
  username text, display_name text, avatar text, total_dxp numeric,
  cases_solved bigint, streak bigint, accuracy numeric, current_case_id text,
  rank text, updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  return query
  select u.id, u.email::text, u.created_at, u.last_sign_in_at,
    p.username::text, p.display_name::text, p.avatar::text,
    coalesce(p.total_dxp,0)::numeric, coalesce(p.cases_solved,0)::bigint,
    coalesce(p.streak,0)::bigint, coalesce(p.accuracy,0)::numeric,
    p.current_case_id::text, p.rank::text, p.updated_at
  from auth.users u
  left join public.profiles p on p.id=u.id
  order by coalesce(p.updated_at,u.created_at) desc;
end; $$;
revoke all on function public.admin_list_users() from public;
grant execute on function public.admin_list_users() to authenticated;

create or replace function public.admin_user_progress(target_user_id uuid)
returns table (case_id text, completed boolean, xp_earned numeric, completed_at timestamptz, updated_at timestamptz, player_name text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  return query select cp.case_id::text, cp.completed, coalesce(cp.xp_earned,0)::numeric,
    cp.completed_at, cp.updated_at, cp.player_name::text
  from public.case_progress cp where cp.user_id=target_user_id
  order by coalesce(cp.completed_at,cp.updated_at) desc nulls last;
end; $$;
revoke all on function public.admin_user_progress(uuid) from public;
grant execute on function public.admin_user_progress(uuid) to authenticated;

-- IMPORTANT: after running this script, make YOUR account an admin.
-- Replace YOUR_LOGIN_EMAIL with the email you use to sign in to Code Detective:
-- insert into public.user_roles (user_id, role)
-- select id, 'admin' from auth.users where email = 'YOUR_LOGIN_EMAIL'
-- on conflict (user_id) do update set role = excluded.role;
