
-- CODE DETECTIVE — AUTH + ADMIN SECURITY UPGRADE
-- Run after the existing FINAL_UPGRADE.sql.
-- This migration adds the server-side admin RPCs used by the separate
-- administrator dashboard and protects the role table from client-side writes.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Secure role lookup
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = p_user_id
      AND lower(trim(ur.role)) = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin(auth.uid());
$$;

REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ---------------------------------------------------------------------------
-- Role-table protection
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own role and admins can read roles" ON public.user_roles;
CREATE POLICY "Users can read own role and admins can read roles"
  ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM authenticated;
GRANT SELECT ON public.user_roles TO authenticated;

-- ---------------------------------------------------------------------------
-- Admin user registry
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE(
  id uuid,
  username text,
  display_name text,
  email text,
  created_at timestamptz,
  updated_at timestamptz,
  last_sign_in_at timestamptz,
  total_dxp numeric,
  cases_solved bigint,
  accuracy numeric,
  streak integer,
  current_case_id text,
  rank text,
  avatar text,
  role text,
  is_admin boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.username::text,
    p.display_name::text,
    COALESCE(p.email::text, u.email::text),
    p.created_at,
    p.updated_at,
    u.last_sign_in_at,
    COALESCE(p.total_dxp, 0)::numeric,
    COALESCE(p.cases_solved, p.cases_completed, 0)::bigint,
    COALESCE(p.accuracy, 0)::numeric,
    GREATEST(COALESCE(p.streak, p.current_streak, 0), 0)::integer,
    p.current_case_id::text,
    COALESCE(p.rank, 'Rookie')::text,
    COALESCE(p.avatar, '🕵️')::text,
    COALESCE(ur.role, 'user')::text,
    lower(COALESCE(ur.role, '')) = 'admin'
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  LEFT JOIN LATERAL (
    SELECT role
    FROM public.user_roles
    WHERE user_id = p.id
    ORDER BY CASE WHEN lower(role) = 'admin' THEN 0 ELSE 1 END
    LIMIT 1
  ) ur ON true
  ORDER BY p.created_at DESC NULLS LAST;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_users() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;

-- ---------------------------------------------------------------------------
-- Admin case history for a selected user
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_user_progress(target_user_id uuid)
RETURNS TABLE(
  case_id text,
  completed boolean,
  xp_earned numeric,
  completed_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;

  RETURN QUERY
  SELECT
    cp.case_id::text,
    COALESCE(cp.completed, false),
    COALESCE(cp.xp_earned, 0)::numeric,
    cp.completed_at,
    cp.updated_at
  FROM public.case_progress cp
  WHERE cp.user_id = target_user_id
  ORDER BY COALESCE(cp.completed_at, cp.updated_at) DESC NULLS LAST;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_user_progress(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_user_progress(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Admin analytics aggregation
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_analytics()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;

  WITH days AS (
    SELECT generate_series(
      current_date - interval '13 days',
      current_date,
      interval '1 day'
    )::date AS day
  ),
  daily AS (
    SELECT
      date(cp.completed_at) AS day,
      count(*)::integer AS count
    FROM public.case_progress cp
    WHERE cp.completed = true
      AND cp.completed_at >= current_date - interval '13 days'
      AND cp.completed_at < current_date + interval '1 day'
    GROUP BY date(cp.completed_at)
  )
  SELECT jsonb_build_object(
    'total_users', (SELECT count(*) FROM public.profiles),
    'completed_cases', (SELECT count(*) FROM public.case_progress WHERE completed = true),
    'active_users_7d', (
      SELECT count(DISTINCT user_id)
      FROM public.case_progress
      WHERE completed = true
        AND completed_at >= now() - interval '7 days'
    ),
    'total_dxp', (
      SELECT COALESCE(sum(COALESCE(total_dxp, 0)), 0)
      FROM public.profiles
    ),
    'completions_by_day', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'day', to_char(days.day, 'YYYY-MM-DD'),
          'count', COALESCE(daily.count, 0)
        )
        ORDER BY days.day
      )
      FROM days
      LEFT JOIN daily ON daily.day = days.day
    ), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_analytics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_analytics() TO authenticated;

-- ---------------------------------------------------------------------------
-- OAuth profile support
-- ---------------------------------------------------------------------------
-- Google-authenticated accounts use the same profiles table as email/password
-- accounts. The application creates a profile only when one does not exist.
-- No role is assigned here; administrator status remains exclusively in
-- public.user_roles.

SELECT
  public.is_admin() AS current_session_is_admin,
  to_regclass('public.profiles') AS profiles_table,
  to_regclass('public.user_roles') AS user_roles_table,
  to_regclass('public.case_progress') AS case_progress_table;
