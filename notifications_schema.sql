-- CODE DETECTIVE NOTIFICATIONS - SUPABASE SETUP
-- Run this entire file once in Supabase Dashboard -> SQL Editor.
-- It is safe to run again; existing policies are recreated cleanly.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- The application already uses public.profiles for authenticated users.
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'general',
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_read BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS notifications_recipient_created_idx
    ON public.notifications (recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_recipient_unread_idx
    ON public.notifications (recipient_id, is_read)
    WHERE is_read = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Make this migration safely re-runnable.
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can view notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications"
    ON public.notifications
    FOR SELECT
    TO authenticated
    USING (auth.uid() = recipient_id);

CREATE POLICY "Users can update their own notifications"
    ON public.notifications
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = recipient_id)
    WITH CHECK (auth.uid() = recipient_id);

CREATE POLICY "Users can delete their own notifications"
    ON public.notifications
    FOR DELETE
    TO authenticated
    USING (auth.uid() = recipient_id);

CREATE POLICY "Admins can insert notifications"
    ON public.notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view notifications"
    ON public.notifications
    FOR SELECT
    TO authenticated
    USING (public.is_admin(auth.uid()));

-- Supabase Realtime: make notification INSERT/UPDATE/DELETE events available
-- to the Home page subscription. The code checks whether the table is already
-- in the publication before adding it, so this is safe to rerun.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) AND NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
END
$$;

ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Explicit PostgREST grants for the authenticated role.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;

-- Verification query. After the script runs this should return one row.
SELECT to_regclass('public.notifications') AS notifications_table;
