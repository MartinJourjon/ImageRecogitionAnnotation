import { createClient } from '@supabase/supabase-js'

// Client Supabase public (clé anonyme) récupérés depuis .env via Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY manquant(e) dans les variables d\'environnement')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
