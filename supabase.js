import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const fallbackUrl = 'https://mbtwdhadyonlirainmxm.supabase.co'
const fallbackPublishableKey = 'sb_publishable_nf6tesnkk71a_NWhwFIjGA_VNtKJgCL'

const runtimeUrl =
  (typeof window !== 'undefined' && window.__SUPABASE_URL__) ||
  import.meta.env.VITE_SUPABASE_URL ||
  fallbackUrl

const runtimeKey =
  (typeof window !== 'undefined' && window.__SUPABASE_PUBLISHABLE_KEY__) ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  fallbackPublishableKey

if (!runtimeUrl || !runtimeKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(runtimeUrl, runtimeKey)