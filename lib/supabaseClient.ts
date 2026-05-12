/**
 * Shared Supabase client — browser-safe (uses anon key).
 *
 * Import this wherever you need a Supabase client in client components
 * or utility functions that run in the browser.
 *
 * For Server Components and API routes, use the server client from
 * @/lib/supabase/server which handles cookie-based auth correctly.
 */

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
