-- CODE DETECTIVE FINAL DATA UPGRADE
-- Run once in Supabase SQL Editor before using the upgraded Admin/Assignment/Streak features.
-- Safe to re-run.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- Admin helper functions
-- -----------------------------------------------------------------------------
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
      AND lower(ur.role) = 'admin'
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

GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- -----------------------------------------------------------------------------
-- Notifications: keep the existing table, add assignment linkage when present.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'general',
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_read boolean NOT NULL DEFAULT false
);

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS assignment_id uuid;

CREATE INDEX IF NOT EXISTS notifications_assignment_idx ON public.notifications(assignment_id);
CREATE INDEX IF NOT EXISTS notifications_recipient_created_idx ON public.notifications(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_recipient_unread_idx ON public.notifications(recipient_id, is_read) WHERE is_read = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can view notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can delete notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = recipient_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = recipient_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = recipient_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING (auth.uid() = recipient_id);

CREATE POLICY "Admins can insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;

-- -----------------------------------------------------------------------------
-- Assignments
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  subject text NOT NULL,
  description text NOT NULL DEFAULT '',
  difficulty text NOT NULL DEFAULT 'Medium',
  due_date date NOT NULL,
  due_time time NOT NULL,
  max_marks integer NOT NULL DEFAULT 0 CHECK (max_marks > 0),
  instructions text NOT NULL DEFAULT '',
  attachment text NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS public.assignment_recipients (
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  submitted boolean NOT NULL DEFAULT false,
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (assignment_id, recipient_id)
);

CREATE INDEX IF NOT EXISTS assignment_recipients_recipient_idx ON public.assignment_recipients(recipient_id);
CREATE INDEX IF NOT EXISTS assignments_due_idx ON public.assignments(due_date, due_time);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'notifications_assignment_id_fkey'
      AND conrelid = 'public.notifications'::regclass
  ) THEN
    ALTER TABLE public.notifications
      ADD CONSTRAINT notifications_assignment_id_fkey
      FOREIGN KEY (assignment_id) REFERENCES public.assignments(id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_recipients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view assigned assignments" ON public.assignments;
DROP POLICY IF EXISTS "Admins can manage assignments" ON public.assignments;
DROP POLICY IF EXISTS "Recipients can view assignment recipients" ON public.assignment_recipients;
DROP POLICY IF EXISTS "Recipients can update own submission" ON public.assignment_recipients;
DROP POLICY IF EXISTS "Admins can manage assignment recipients" ON public.assignment_recipients;

CREATE POLICY "Students can view assigned assignments"
  ON public.assignments FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid()) OR EXISTS (
      SELECT 1 FROM public.assignment_recipients ar
      WHERE ar.assignment_id = assignments.id AND ar.recipient_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage assignments"
  ON public.assignments FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Recipients can view assignment recipients"
  ON public.assignment_recipients FOR SELECT TO authenticated
  USING (recipient_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Recipients can update own submission"
  ON public.assignment_recipients FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (recipient_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage assignment recipients"
  ON public.assignment_recipients FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

GRANT SELECT ON public.assignments TO authenticated;
GRANT SELECT, UPDATE ON public.assignment_recipients TO authenticated;
GRANT ALL ON public.assignments TO authenticated;
GRANT ALL ON public.assignment_recipients TO authenticated;

-- -----------------------------------------------------------------------------
-- Admin-safe deletion helpers
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_delete_notification(p_notification_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;
  DELETE FROM public.notifications WHERE id = p_notification_id;
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_assignment(p_assignment_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;
  DELETE FROM public.assignments WHERE id = p_assignment_id;
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_notification(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_assignment(uuid) TO authenticated;

-- -----------------------------------------------------------------------------
-- Streak protection
-- At risk = an active streak and the student's most recent completed case was
-- yesterday (or, if the profile streak is stale, any non-zero streak with no
-- completion today and recent activity within the last 48 hours).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_streak_at_risk()
RETURNS TABLE(
  user_id uuid,
  username text,
  display_name text,
  email text,
  streak integer,
  last_activity timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  WITH latest AS (
    SELECT cp.user_id, max(cp.completed_at) AS last_activity
    FROM public.case_progress cp
    WHERE cp.completed = true
    GROUP BY cp.user_id
  )
  SELECT
    p.id,
    p.username,
    COALESCE(p.display_name, p.username, split_part(u.email, '@', 1)) AS display_name,
    u.email,
    GREATEST(COALESCE(NULLIF(to_jsonb(p)->>'streak','')::integer, NULLIF(to_jsonb(p)->>'current_streak','')::integer, 0), 0)::integer,
    latest.last_activity
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  JOIN latest ON latest.user_id = p.id
  WHERE GREATEST(COALESCE(NULLIF(to_jsonb(p)->>'streak','')::integer, NULLIF(to_jsonb(p)->>'current_streak','')::integer, 0), 0) > 0
    AND latest.last_activity >= date_trunc('day', now()) - interval '1 day'
    AND latest.last_activity < date_trunc('day', now())
  ORDER BY GREATEST(COALESCE(NULLIF(to_jsonb(p)->>'streak','')::integer, NULLIF(to_jsonb(p)->>'current_streak','')::integer, 0), 0) DESC, latest.last_activity ASC;
$$;

GRANT EXECUTE ON FUNCTION public.admin_streak_at_risk() TO authenticated;

CREATE OR REPLACE FUNCTION public.send_streak_reminders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  admin_sender uuid;
  r record;
  inserted_count integer := 0;
BEGIN
  SELECT ur.user_id INTO admin_sender
  FROM public.user_roles ur
  WHERE lower(ur.role) = 'admin'
  LIMIT 1;

  IF admin_sender IS NULL THEN
    RETURN 0;
  END IF;

  FOR r IN SELECT * FROM public.admin_streak_at_risk() LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.recipient_id = r.user_id
        AND n.type = 'streak'
        AND n.created_at::date = current_date
    ) THEN
      INSERT INTO public.notifications(title, message, type, sender_id, recipient_id, is_read)
      VALUES (
        '🔥 Your streak is at risk',
        format('Your %s-day streak is at risk. Complete at least one Code Detective case today to keep it alive.', r.streak),
        'streak', admin_sender, r.user_id, false
      );
      inserted_count := inserted_count + 1;
    END IF;
  END LOOP;

  RETURN inserted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_streak_reminders() TO authenticated;

-- -----------------------------------------------------------------------------
-- Supabase Realtime
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='notifications') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='assignments') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.assignments;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='assignment_recipients') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.assignment_recipients;
    END IF;
  END IF;
END $$;

ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.assignments REPLICA IDENTITY FULL;
ALTER TABLE public.assignment_recipients REPLICA IDENTITY FULL;

-- -----------------------------------------------------------------------------
-- Automated streak reminders: daily at 18:00 IST = 12:30 UTC.
-- If pg_cron is already enabled in Supabase, this schedules the job.
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'code-detective-streak-reminders') THEN
    PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'code-detective-streak-reminders';
  END IF;
  PERFORM cron.schedule(
    'code-detective-streak-reminders',
    '30 12 * * *',
    $cron$SELECT public.send_streak_reminders();$cron$
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not schedule pg_cron job automatically: %', SQLERRM;
END $$;

-- Run this manually once if you want to test the automation immediately:
-- SELECT public.send_streak_reminders();

SELECT
  to_regclass('public.notifications') AS notifications_table,
  to_regclass('public.assignments') AS assignments_table,
  to_regclass('public.assignment_recipients') AS assignment_recipients_table;



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
