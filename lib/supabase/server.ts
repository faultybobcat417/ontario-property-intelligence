/**
 * Server-side Supabase clients for Server Components and API routes.
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import type { Database } from "@/types/database"

export async function createClient() {

  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {

        get(name: string) {
          return cookieStore.get(name)?.value
        },

        set(_name: string, _value: string, _options: CookieOptions) {
          /**
           * Server Components cannot write cookies.
           * Supabase may attempt to update the auth cookie,
           * so we ignore writes here.
           */
        },

        remove(_name: string, _options: CookieOptions) {
          /**
           * Same reason — cookie removal disabled in RSC.
           */
        },
      },
    }
  )
}

export function createAdminClient() {

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}