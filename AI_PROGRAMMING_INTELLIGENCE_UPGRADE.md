# Code Detective — Programming Intelligence Upgrade

This upgrade builds on the existing Code Detective architecture. It does not replace authentication, Notes, cases, assignments, notifications, or the existing Admin workspace.

## What changed

### Student AI Tutor
- Programming-specific teaching behavior.
- Explain / Explain Code / Debug / Practice quick actions.
- Structured tutoring response with topic, skill level, teaching mode, common mistake, practice question and next step.
- Clear distinction between selected-note-grounded content and general programming knowledge.
- Lightweight retrieval across the user's available notes to supply related context when relevant.
- Learning telemetry records tutor activity without exposing private data to the client.
- Conservative learning profile showing activity/focus signals rather than fabricated mastery percentages.

### Admin AI
- New **AI Insights** section in Admin HQ.
- Natural-language questions about live learning activity.
- Grounding against `admin_analytics()` and `admin_learning_analytics()`.
- Explicit handling of insufficient evidence; the AI is instructed not to invent statistics.
- Recommendations for difficult topics, tutor demand, note usage and content gaps.

### Data layer
Run:
- `AI_PROGRAMMING_INTELLIGENCE_UPGRADE.sql`

It adds:
- `learning_events`
- `record_learning_event()`
- `student_learning_profile()`
- `admin_learning_analytics()`

Existing RLS and admin authorization are preserved.

## Edge Functions
Deploy the updated:
- `supabase/functions/ai-tutor/index.ts`
- `supabase/functions/admin-ai/index.ts`

Required secret remains:
- `OPENROUTER_API_KEY`

Optional:
- `OPENROUTER_MODEL`
- `APP_URL`

## Web deployment
The `dist` directory has been updated with the new direct-module files as a no-build deployment path because the uploaded archive did not contain an installed Vite toolchain. The original source project remains intact.

For a normal development build, install dependencies and run `npm run build` from the project root.
