import { createClient } from '@supabase/supabase-js'

// Client service_role — bypass RLS complet.
// À utiliser UNIQUEMENT dans les Route Handlers serveur, jamais côté client.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured')
  return createClient(url, key)
}
