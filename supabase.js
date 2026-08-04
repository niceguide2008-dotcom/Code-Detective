import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const fallbackUrl = 'https://mbtwdhadyonlirainmxm.supabase.co'

const fallbackPublishableKey =
  'sb_publishable_nf6tesnkk71a_NWhwFIjGA_VNtKJgCL'

// Allow optional runtime configuration.
// If none is provided, use the project's public Supabase credentials.
const runtimeUrl =
  (typeof window !== 'undefined' && window.__SUPABASE_URL__) ||
  fallbackUrl

const runtimeKey =
  (typeof window !== 'undefined' &&
    window.__SUPABASE_PUBLISHABLE_KEY__) ||
  fallbackPublishableKey

if (!runtimeUrl || !runtimeKey) {
  throw new Error('Missing Supabase configuration')
}

export const supabase = createClient(runtimeUrl, runtimeKey)