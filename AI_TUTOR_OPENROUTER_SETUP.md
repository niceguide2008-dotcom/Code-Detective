# AI Tutor — OpenRouter Setup

The Notes AI Tutor now supports OpenRouter and keeps the API key server-side in the Supabase Edge Function.

## Recommended configuration

In Supabase Dashboard:

1. Open Edge Functions / Secrets.
2. Add:
   - `OPENROUTER_API_KEY` = your OpenRouter API key
   - Optional `OPENROUTER_MODEL` = `openrouter/free`
   - Optional `APP_URL` = `https://codedetective1913.netlify.app`
3. Deploy/redeploy the `ai-tutor` Edge Function.
4. Sign in to Code Detective, open Notes, select a note, and ask the tutor a question.

`openrouter/free` is used by default. It routes to an available free model. You can later set `OPENROUTER_MODEL` to a specific model if desired.

## Security

Do NOT put the OpenRouter key in `notes-ai.js`, `ai-client.js`, HTML, or any frontend environment variable that is shipped to the browser. Supabase Edge Function secrets are used so the key stays server-side.

The existing OpenAI configuration remains as a fallback if `OPENROUTER_API_KEY` is not set.
