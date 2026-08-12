-- CODE DETECTIVE: PROGRAMMING LEARNING INTELLIGENCE UPGRADE
-- Run after AI_NOTES_SETUP.sql and AUTH_ADMIN_SECURITY_UPGRADE.sql.
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS public.learning_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  topic text,
  note_id uuid,
  note_title text,
  question text,
  outcome text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS learning_events_user_created_idx ON public.learning_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS learning_events_topic_idx ON public.learning_events(topic, created_at DESC);
CREATE INDEX IF NOT EXISTS learning_events_type_idx ON public.learning_events(event_type, created_at DESC);

ALTER TABLE public.learning_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert own learning events" ON public.learning_events;
DROP POLICY IF EXISTS "Users can view own learning events" ON public.learning_events;
DROP POLICY IF EXISTS "Admins can view learning events" ON public.learning_events;
CREATE POLICY "Users can insert own learning events" ON public.learning_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own learning events" ON public.learning_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Admins can view learning events" ON public.learning_events FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
GRANT SELECT, INSERT ON public.learning_events TO authenticated;

-- A single controlled write path for client telemetry.
CREATE OR REPLACE FUNCTION public.record_learning_event(
  p_event_type text,
  p_topic text DEFAULT NULL,
  p_note_id uuid DEFAULT NULL,
  p_note_title text DEFAULT NULL,
  p_question text DEFAULT NULL,
  p_outcome text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE new_id uuid;
BEGIN
  INSERT INTO public.learning_events(user_id,event_type,topic,note_id,note_title,question,outcome,metadata)
  VALUES(auth.uid(), left(trim(p_event_type),80), left(nullif(trim(p_topic),''),160), p_note_id,
         left(nullif(trim(p_note_title),''),200), left(nullif(trim(p_question),''),4000),
         left(nullif(trim(p_outcome),''),120), COALESCE(p_metadata,'{}'::jsonb))
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.record_learning_event(text,text,uuid,text,text,text,jsonb) TO authenticated;

-- Student learning profile: intentionally conservative. It reports activity signals,
-- not fake mastery percentages.
CREATE OR REPLACE FUNCTION public.student_learning_profile()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'questions_30d', (SELECT count(*) FROM public.learning_events WHERE user_id=auth.uid() AND event_type='tutor_question' AND created_at >= now()-interval '30 days'),
    'practice_attempts_30d', (SELECT count(*) FROM public.learning_events WHERE user_id=auth.uid() AND event_type='practice_attempt' AND created_at >= now()-interval '30 days'),
    'topics', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('topic',topic,'questions',question_count,'last_seen',last_seen) ORDER BY question_count DESC, last_seen DESC)
      FROM (
        SELECT topic, count(*)::integer question_count, max(created_at) last_seen
        FROM public.learning_events
        WHERE user_id=auth.uid() AND topic IS NOT NULL AND created_at >= now()-interval '30 days'
        GROUP BY topic
        ORDER BY count(*) DESC, max(created_at) DESC
        LIMIT 8
      ) q
    ), '[]'::jsonb),
    'recent_questions', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('question',question,'topic',topic,'created_at',created_at) ORDER BY created_at DESC)
      FROM (
        SELECT question,topic,created_at FROM public.learning_events
        WHERE user_id=auth.uid() AND event_type='tutor_question' AND question IS NOT NULL
        ORDER BY created_at DESC LIMIT 5
      ) r
    ), '[]'::jsonb)
  ) INTO result;
  RETURN result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.student_learning_profile() TO authenticated;

-- Admin-safe aggregated learning intelligence. No individual question text is exposed
-- here unless it is a repeated topic-level signal; detailed data remains in the protected table.
CREATE OR REPLACE FUNCTION public.admin_learning_analytics()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Administrator access required'; END IF;

  SELECT jsonb_build_object(
    'generated_at', now(),
    'active_users_7d', (SELECT count(DISTINCT user_id) FROM public.learning_events WHERE created_at >= now()-interval '7 days'),
    'tutor_questions_7d', (SELECT count(*) FROM public.learning_events WHERE event_type='tutor_question' AND created_at >= now()-interval '7 days'),
    'practice_attempts_7d', (SELECT count(*) FROM public.learning_events WHERE event_type='practice_attempt' AND created_at >= now()-interval '7 days'),
    'top_topics_30d', COALESCE((SELECT jsonb_agg(jsonb_build_object('topic',topic,'questions',cnt,'students',students) ORDER BY cnt DESC) FROM (
      SELECT topic,count(*)::integer cnt,count(DISTINCT user_id)::integer students
      FROM public.learning_events WHERE event_type='tutor_question' AND topic IS NOT NULL AND created_at >= now()-interval '30 days'
      GROUP BY topic ORDER BY count(*) DESC LIMIT 12
    ) t),'[]'::jsonb),
    'struggling_topics_30d', COALESCE((SELECT jsonb_agg(jsonb_build_object('topic',topic,'questions',cnt,'students',students,'repeat_users',repeat_users) ORDER BY repeat_users DESC,cnt DESC) FROM (
      SELECT topic,count(*)::integer cnt,count(DISTINCT user_id)::integer students,
             count(DISTINCT user_id) FILTER (WHERE user_question_count >= 2)::integer repeat_users
      FROM (
        SELECT topic,user_id,count(*) OVER (PARTITION BY topic,user_id) user_question_count
        FROM public.learning_events
        WHERE event_type='tutor_question' AND topic IS NOT NULL AND created_at >= now()-interval '30 days'
      ) x GROUP BY topic ORDER BY repeat_users DESC,count(*) DESC LIMIT 12
    ) s),'[]'::jsonb),
    'note_usage_30d', COALESCE((SELECT jsonb_agg(jsonb_build_object('note_id',note_id,'note_title',note_title,'questions',cnt,'students',students) ORDER BY cnt DESC) FROM (
      SELECT note_id,max(note_title) note_title,count(*)::integer cnt,count(DISTINCT user_id)::integer students
      FROM public.learning_events WHERE event_type='tutor_question' AND note_id IS NOT NULL AND created_at >= now()-interval '30 days'
      GROUP BY note_id ORDER BY count(*) DESC LIMIT 12
    ) n),'[]'::jsonb),
    'least_used_notes_30d', COALESCE((SELECT jsonb_agg(jsonb_build_object('note_id',note_id,'note_title',note_title,'questions',questions,'students',students) ORDER BY questions,note_title) FROM (
      SELECT g.id note_id,g.title note_title,COALESCE(u.cnt,0)::integer questions,COALESCE(u.students,0)::integer students
      FROM public.global_notes g LEFT JOIN (
        SELECT note_id,count(*)::integer cnt,count(DISTINCT user_id)::integer students FROM public.learning_events
        WHERE event_type='tutor_question' AND created_at >= now()-interval '30 days' GROUP BY note_id
      ) u ON u.note_id=g.id ORDER BY COALESCE(u.cnt,0),g.title LIMIT 12
    ) lu),'[]'::jsonb),
    'event_counts_30d', COALESCE((SELECT jsonb_object_agg(event_type,cnt) FROM (
      SELECT event_type,count(*)::integer cnt FROM public.learning_events WHERE created_at >= now()-interval '30 days' GROUP BY event_type
    ) e),'{}'::jsonb)
  ) INTO result;
  RETURN result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_learning_analytics() TO authenticated;
