-- CODE DETECTIVE — FEATURES 17–22 ACHIEVEMENT SYSTEM
-- Safe to re-run. Extends the existing badges/user_badges system.
-- Only achievements backed by reliable existing database state are implemented.

create extension if not exists pgcrypto;

create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null,
  icon text not null default '🏅',
  category text not null default 'achievement',
  requirement text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (user_id, badge_id)
);

alter table public.badges add column if not exists description text;
alter table public.badges add column if not exists icon text;
alter table public.badges add column if not exists category text;
alter table public.badges add column if not exists requirement text;
alter table public.badges add column if not exists created_at timestamptz default now();
alter table public.user_badges add column if not exists earned_at timestamptz default now();
alter table public.user_badges add column if not exists metadata jsonb default '{}'::jsonb;

create unique index if not exists idx_badges_name_unique on public.badges(name);
create index if not exists idx_user_badges_user_id on public.user_badges(user_id);
create index if not exists idx_user_badges_badge_id on public.user_badges(badge_id);

-- Existing achievements are preserved and updated in place.
insert into public.badges (name, description, icon, category, requirement)
values
  ('Case Lover', 'Solved 19 hard cases and proved that no case is too difficult.', '❤️', 'case mastery', '19 unique HARD-level cases solved'),
  ('Streak Lover', 'Maintained a legendary 19-day streak.', '🔥', 'streak', '19 consecutive activity days'),
  ('Badge Earner', 'Earned both Case Lover and Streak Lover — a true Code Detective achievement hunter.', '🏆', 'master', 'Case Lover + Streak Lover'),
  ('First 19', 'Completed your first 19 investigations.', '🔎', 'milestone', '19 unique cases solved'),
  ('Case File 19', 'Opened the mysterious nineteenth case file.', '🗂️', 'investigation', 'Case #19 successfully completed'),
  ('Double 19', '38 investigations completed. You found the pattern.', '✖️', 'milestone', '38 unique cases solved'),
  ('Triple 19', '57 cases solved. The 19 pattern is becoming impossible to ignore.', '3️⃣', 'milestone', '57 unique cases solved')
on conflict (name) do update set
  description = excluded.description,
  icon = excluded.icon,
  category = excluded.category,
  requirement = excluded.requirement;

alter table public.badges enable row level security;
alter table public.user_badges enable row level security;

drop policy if exists "badges_authenticated_read" on public.badges;
create policy "badges_authenticated_read" on public.badges
for select to authenticated using (true);

drop policy if exists "user_badges_self_read" on public.user_badges;
create policy "user_badges_self_read" on public.user_badges
for select to authenticated using (user_id = auth.uid());

-- Authenticated users intentionally have no INSERT/UPDATE/DELETE policy on user_badges.
-- The SECURITY DEFINER evaluator below is the trusted award path.

create or replace function public.evaluate_user_achievements(target_user_id uuid default auth.uid())
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  hard_case_count integer := 0;
  total_case_count integer := 0;
  streak_days integer := 0;
  case_19_solved boolean := false;
  case_lover_id uuid;
  streak_lover_id uuid;
  badge_earner_id uuid;
  first_19_id uuid;
  case_file_19_id uuid;
  double_19_id uuid;
  triple_19_id uuid;
  newly_earned jsonb := '[]'::jsonb;
  anchor_date date;
  next_date date;
  inserted_count integer;
begin
  if target_user_id is null or current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if target_user_id <> current_user_id and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Users may evaluate achievements only for themselves';
  end if;

  -- Unique completed investigations. case_progress is the existing source of truth.
  select count(distinct cp.case_id)::integer
    into total_case_count
  from public.case_progress cp
  where cp.user_id = target_user_id
    and cp.completed = true;

  -- Existing hard-case IDs use the application's U2-H01/U5-H18 style convention.
  select count(distinct cp.case_id)::integer
    into hard_case_count
  from public.case_progress cp
  where cp.user_id = target_user_id
    and cp.completed = true
    and cp.case_id ~ '^[A-Z0-9]+-H[0-9]+$';

  -- Case #19 is a real persisted case with the existing CASE-19 ID.
  select exists (
    select 1
    from public.case_progress cp
    where cp.user_id = target_user_id
      and cp.completed = true
      and cp.case_id = 'CASE-19'
  ) into case_19_solved;

  -- Existing activity is case completion. Multiple completions on one day count once.
  with activity_days as (
    select distinct (cp.completed_at at time zone 'Asia/Kolkata')::date as activity_date
    from public.case_progress cp
    where cp.user_id = target_user_id
      and cp.completed = true
      and cp.completed_at is not null
  )
  select max(activity_date) into anchor_date from activity_days;

  if anchor_date is null or anchor_date < ((now() at time zone 'Asia/Kolkata')::date - 1) then
    streak_days := 0;
  else
    streak_days := 1;
    next_date := anchor_date - 1;
    loop
      exit when not exists (
        select 1
        from public.case_progress cp
        where cp.user_id = target_user_id
          and cp.completed = true
          and cp.completed_at is not null
          and (cp.completed_at at time zone 'Asia/Kolkata')::date = next_date
      );
      streak_days := streak_days + 1;
      next_date := next_date - 1;
    end loop;
  end if;

  select id into case_lover_id from public.badges where name = 'Case Lover';
  select id into streak_lover_id from public.badges where name = 'Streak Lover';
  select id into badge_earner_id from public.badges where name = 'Badge Earner';
  select id into first_19_id from public.badges where name = 'First 19';
  select id into case_file_19_id from public.badges where name = 'Case File 19';
  select id into double_19_id from public.badges where name = 'Double 19';
  select id into triple_19_id from public.badges where name = 'Triple 19';

  -- Existing badges.
  if case_lover_id is not null and hard_case_count >= 19 then
    insert into public.user_badges (user_id, badge_id, metadata)
    values (target_user_id, case_lover_id, jsonb_build_object('hard_cases_solved', hard_case_count))
    on conflict (user_id, badge_id) do nothing;
    get diagnostics inserted_count = row_count;
    if inserted_count > 0 then newly_earned := newly_earned || jsonb_build_array('Case Lover'); end if;
  end if;

  if streak_lover_id is not null and streak_days >= 19 then
    insert into public.user_badges (user_id, badge_id, metadata)
    values (target_user_id, streak_lover_id, jsonb_build_object('streak_days', streak_days))
    on conflict (user_id, badge_id) do nothing;
    get diagnostics inserted_count = row_count;
    if inserted_count > 0 then newly_earned := newly_earned || jsonb_build_array('Streak Lover'); end if;
  end if;

  -- Master badge is evaluated after both prerequisites in the same transaction.
  if case_lover_id is not null and streak_lover_id is not null and badge_earner_id is not null
     and exists (select 1 from public.user_badges where user_id = target_user_id and badge_id = case_lover_id)
     and exists (select 1 from public.user_badges where user_id = target_user_id and badge_id = streak_lover_id) then
    insert into public.user_badges (user_id, badge_id, metadata)
    values (target_user_id, badge_earner_id, jsonb_build_object('prerequisites', jsonb_build_array('Case Lover', 'Streak Lover')))
    on conflict (user_id, badge_id) do nothing;
    get diagnostics inserted_count = row_count;
    if inserted_count > 0 then newly_earned := newly_earned || jsonb_build_array('Badge Earner'); end if;
  end if;

  -- New 19-themed achievements backed entirely by persisted case completion state.
  if first_19_id is not null and total_case_count >= 19 then
    insert into public.user_badges (user_id, badge_id, metadata)
    values (target_user_id, first_19_id, jsonb_build_object('total_cases_solved', total_case_count))
    on conflict (user_id, badge_id) do nothing;
    get diagnostics inserted_count = row_count;
    if inserted_count > 0 then newly_earned := newly_earned || jsonb_build_array('First 19'); end if;
  end if;

  if case_file_19_id is not null and case_19_solved then
    insert into public.user_badges (user_id, badge_id, metadata)
    values (target_user_id, case_file_19_id, jsonb_build_object('case_id', 'CASE-19'))
    on conflict (user_id, badge_id) do nothing;
    get diagnostics inserted_count = row_count;
    if inserted_count > 0 then newly_earned := newly_earned || jsonb_build_array('Case File 19'); end if;
  end if;

  if double_19_id is not null and total_case_count >= 38 then
    insert into public.user_badges (user_id, badge_id, metadata)
    values (target_user_id, double_19_id, jsonb_build_object('total_cases_solved', total_case_count, 'milestone', 38))
    on conflict (user_id, badge_id) do nothing;
    get diagnostics inserted_count = row_count;
    if inserted_count > 0 then newly_earned := newly_earned || jsonb_build_array('Double 19'); end if;
  end if;

  if triple_19_id is not null and total_case_count >= 57 then
    insert into public.user_badges (user_id, badge_id, metadata)
    values (target_user_id, triple_19_id, jsonb_build_object('total_cases_solved', total_case_count, 'milestone', 57))
    on conflict (user_id, badge_id) do nothing;
    get diagnostics inserted_count = row_count;
    if inserted_count > 0 then newly_earned := newly_earned || jsonb_build_array('Triple 19'); end if;
  end if;

  return jsonb_build_object(
    'total_cases_solved', total_case_count,
    'total_case_target', 19,
    'hard_cases_solved', hard_case_count,
    'hard_case_target', 19,
    'streak_days', streak_days,
    'streak_target', 19,
    'case_19_solved', case_19_solved,
    'case_19_id', 'CASE-19',
    'newly_earned', newly_earned
  );
end;
$$;

revoke all on function public.evaluate_user_achievements(uuid) from public;
grant execute on function public.evaluate_user_achievements(uuid) to authenticated;
