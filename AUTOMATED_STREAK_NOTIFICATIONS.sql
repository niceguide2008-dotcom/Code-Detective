-- CODE DETECTIVE AUTOMATED STREAK NOTIFICATIONS
-- Run FINAL_UPGRADE.sql first. This file is useful when the assignment/notification schema is already installed.

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
