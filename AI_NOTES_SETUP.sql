-- CODE DETECTIVE: NOTES + AI TUTOR
CREATE TABLE IF NOT EXISTS public.student_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL DEFAULT 'General',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS student_notes_user_updated_idx ON public.student_notes(user_id, updated_at DESC);
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own notes" ON public.student_notes;
DROP POLICY IF EXISTS "Users can insert own notes" ON public.student_notes;
DROP POLICY IF EXISTS "Users can update own notes" ON public.student_notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON public.student_notes;
CREATE POLICY "Users can view own notes" ON public.student_notes FOR SELECT TO authenticated USING (auth.uid()=user_id);
CREATE POLICY "Users can insert own notes" ON public.student_notes FOR INSERT TO authenticated WITH CHECK (auth.uid()=user_id);
CREATE POLICY "Users can update own notes" ON public.student_notes FOR UPDATE TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE POLICY "Users can delete own notes" ON public.student_notes FOR DELETE TO authenticated USING (auth.uid()=user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_notes TO authenticated;


-- Shared Notes Library: administrator-published notes visible to all signed-in students.
CREATE TABLE IF NOT EXISTS public.global_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL DEFAULT 'General',
  file_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS global_notes_updated_idx ON public.global_notes(updated_at DESC);
ALTER TABLE public.global_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view shared notes" ON public.global_notes;
DROP POLICY IF EXISTS "Admins can insert shared notes" ON public.global_notes;
DROP POLICY IF EXISTS "Admins can update shared notes" ON public.global_notes;
DROP POLICY IF EXISTS "Admins can delete shared notes" ON public.global_notes;
CREATE POLICY "Authenticated users can view shared notes" ON public.global_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert shared notes" ON public.global_notes FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update shared notes" ON public.global_notes FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete shared notes" ON public.global_notes FOR DELETE TO authenticated USING (public.is_admin());
GRANT SELECT ON public.global_notes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.global_notes TO authenticated;
