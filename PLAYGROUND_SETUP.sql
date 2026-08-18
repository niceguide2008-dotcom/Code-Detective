-- CODE DETECTIVE PLAYGROUND
-- Secure Java-program jigsaw challenge schema.
-- Run this file in Supabase SQL Editor before using the Playground.

create table if not exists public.playground_challenges (
  id uuid primary key default gen_random_uuid(),
  challenge_number integer not null unique,
  title text not null,
  question text not null,
  difficulty text not null default 'Beginner' check (difficulty in ('Beginner','Intermediate','Advanced')),
  category text not null default 'Basics',
  language text not null default 'Java',
  pieces jsonb not null default '[]'::jsonb,
  points integer not null default 50 check (points >= 0 and points <= 10000),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.playground_solutions (
  challenge_id uuid primary key references public.playground_challenges(id) on delete cascade,
  correct_order jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.playground_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_id uuid not null references public.playground_challenges(id) on delete cascade,
  attempts integer not null default 0,
  completed boolean not null default false,
  xp_earned integer not null default 0,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, challenge_id)
);

alter table public.playground_challenges enable row level security;
alter table public.playground_solutions enable row level security;
alter table public.playground_progress enable row level security;

-- Remove broad grants first so normal users cannot read the secure tables directly.
revoke all on public.playground_challenges from anon, authenticated;
revoke all on public.playground_solutions from anon, authenticated;
revoke all on public.playground_progress from anon, authenticated;

-- Admins can manage challenge definitions and solutions.
create policy playground_challenges_admin_all on public.playground_challenges
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy playground_solutions_admin_all on public.playground_solutions
for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Students can see only their own progress.
create policy playground_progress_self_select on public.playground_progress
for select to authenticated using (auth.uid() = user_id or public.is_admin());

-- Public-safe challenge view: intentionally omits the correct order.
drop view if exists public.playground_public_challenges;
create view public.playground_public_challenges
with (security_barrier = true)
as
select id, challenge_number, title, question, difficulty, category, language, pieces, points, is_active, created_at, updated_at
from public.playground_challenges
where is_active = true;

grant select on public.playground_public_challenges to authenticated;

-- Validation + one-time XP award. The correct order never leaves the database.
create or replace function public.complete_playground_challenge(
  p_challenge_id uuid,
  p_order text[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_solution text[];
  v_correct boolean := false;
  v_wrong_positions integer[] := '{}'::integer[];
  v_points integer := 0;
  v_awarded integer := 0;
  v_already boolean := false;
  v_i integer;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select array(select jsonb_array_elements_text(s.correct_order)), c.points
    into v_solution, v_points
  from public.playground_solutions s
  join public.playground_challenges c on c.id = s.challenge_id
  where s.challenge_id = p_challenge_id and c.is_active = true;

  if v_solution is null then
    raise exception 'Challenge not found or inactive';
  end if;

  v_correct := (v_solution = p_order);

  if not v_correct then
    for v_i in 1..greatest(array_length(v_solution,1), array_length(p_order,1)) loop
      if coalesce(v_solution[v_i], '') <> coalesce(p_order[v_i], '') then
        v_wrong_positions := array_append(v_wrong_positions, v_i - 1);
      end if;
    end loop;
  end if;

  insert into public.playground_progress(user_id, challenge_id, attempts, completed, xp_earned, updated_at)
  values(v_user, p_challenge_id, 1, false, 0, now())
  on conflict(user_id, challenge_id)
  do update set attempts = public.playground_progress.attempts + 1, updated_at = now();

  if v_correct then
    select completed, xp_earned into v_already, v_awarded
    from public.playground_progress
    where user_id = v_user and challenge_id = p_challenge_id;

    if not v_already then
      v_awarded := greatest(0, v_points);
      update public.playground_progress
      set completed = true, xp_earned = v_awarded, completed_at = now(), updated_at = now()
      where user_id = v_user and challenge_id = p_challenge_id;

      update public.profiles
      set total_dxp = coalesce(total_dxp, 0) + v_awarded,
          updated_at = now()
      where id = v_user;
    else
      v_awarded := 0;
    end if;
  end if;

  return jsonb_build_object(
    'correct', v_correct,
    'xp_awarded', v_awarded,
    'already_completed', v_already,
    'wrong_positions', to_jsonb(v_wrong_positions)
  );
end;
$$;

grant execute on function public.complete_playground_challenge(uuid,text[]) to authenticated;

-- Admin-only convenience RPC for dashboard management.
create or replace function public.admin_playground_challenges()
returns table(
  id uuid, challenge_number integer, title text, question text, difficulty text,
  category text, language text, pieces jsonb, points integer, is_active boolean,
  correct_order jsonb, created_at timestamptz, updated_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select c.id,c.challenge_number,c.title,c.question,c.difficulty,c.category,c.language,
         c.pieces,c.points,c.is_active,s.correct_order,c.created_at,c.updated_at
  from public.playground_challenges c
  left join public.playground_solutions s on s.challenge_id=c.id
  where public.is_admin()
  order by c.challenge_number;
$$;
grant execute on function public.admin_playground_challenges() to authenticated;

-- Seed three starter challenges only when the Playground is empty.
do $$
declare
  v_id uuid;
begin
  if not exists(select 1 from public.playground_challenges) then
    v_id := '00000000-0000-0000-0000-000000000101';
    insert into public.playground_challenges(id,challenge_number,title,question,difficulty,category,language,pieces,points,is_active)
    values(v_id,1,'Sum of Two Integers','Create a Java program that calculates the sum of two integers and displays the result.','Beginner','Basics','Java',
      '[{"id":"p1","code":"public class Main"},{"id":"p2","code":"{"},{"id":"p3","code":"public static void main(String[] args)"},{"id":"p4","code":"{"},{"id":"p5","code":"int a = 10;"},{"id":"p6","code":"int b = 20;"},{"id":"p7","code":"System.out.println(a + b);"},{"id":"p8","code":"}"},{"id":"p9","code":"}"}]'::jsonb,50,true)
    on conflict(id) do nothing;
    insert into public.playground_solutions(challenge_id,correct_order) values(v_id,'["p1","p2","p3","p4","p5","p6","p7","p8","p9"]'::jsonb) on conflict(challenge_id) do nothing;

    v_id := '00000000-0000-0000-0000-000000000102';
    insert into public.playground_challenges(id,challenge_number,title,question,difficulty,category,language,pieces,points,is_active)
    values(v_id,2,'Even or Odd','Create a Java program that checks whether an integer is even or odd.','Beginner','Loops','Java',
      '[{"id":"p1","code":"public class Main"},{"id":"p2","code":"{"},{"id":"p3","code":"public static void main(String[] args)"},{"id":"p4","code":"{"},{"id":"p5","code":"int n = 12;"},{"id":"p6","code":"if (n % 2 == 0)"},{"id":"p7","code":"{"},{"id":"p8","code":"System.out.println(\"Even\");"},{"id":"p9","code":"}"},{"id":"p10","code":"else"},{"id":"p11","code":"{"},{"id":"p12","code":"System.out.println(\"Odd\");"},{"id":"p13","code":"}"},{"id":"p14","code":"}"},{"id":"p15","code":"}"}]'::jsonb,60,true)
    on conflict(id) do nothing;
    insert into public.playground_solutions(challenge_id,correct_order) values(v_id,'["p1","p2","p3","p4","p5","p6","p7","p8","p9","p10","p11","p12","p13","p14","p15"]'::jsonb) on conflict(challenge_id) do nothing;

    v_id := '00000000-0000-0000-0000-000000000103';
    insert into public.playground_challenges(id,challenge_number,title,question,difficulty,category,language,pieces,points,is_active)
    values(v_id,3,'Student Class','Create a Java program that defines a Student class with a name field and prints a student name.','Intermediate','Classes','Java',
      '[{"id":"p1","code":"class Student"},{"id":"p2","code":"{"},{"id":"p3","code":"String name;"},{"id":"p4","code":"}"},{"id":"p5","code":"public class Main"},{"id":"p6","code":"{"},{"id":"p7","code":"public static void main(String[] args)"},{"id":"p8","code":"{"},{"id":"p9","code":"Student s = new Student();"},{"id":"p10","code":"s.name = \"Alex\";"},{"id":"p11","code":"System.out.println(s.name);"},{"id":"p12","code":"}"},{"id":"p13","code":"}"}]'::jsonb,75,true)
    on conflict(id) do nothing;
    insert into public.playground_solutions(challenge_id,correct_order) values(v_id,'["p1","p2","p3","p4","p5","p6","p7","p8","p9","p10","p11","p12","p13"]'::jsonb) on conflict(challenge_id) do nothing;
  end if;
end $$;

notify pgrst, 'reload schema';
