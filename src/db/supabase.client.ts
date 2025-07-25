import type { AstroCookies } from 'astro';
import { createServerClient, type CookieOptionsWithName } from '@supabase/ssr';
import type { Database } from './database.types';

export const cookieOptions: CookieOptionsWithName = {
  name: 'sb',
  path: '/',
  secure: import.meta.env.PROD,
  httpOnly: true,
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

export const createSupabaseServerInstance = (context: {
  headers: Headers;
  cookies: AstroCookies;
}) => {
  const supabase = createServerClient<Database>(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_KEY,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
      cookies: {
        get(name) {
          return context.cookies.get(name)?.value;
        },
        set(name, value, options) {
          context.cookies.set(name, value, options);
        },
        remove(name, options) {
          context.cookies.delete(name, options);
        },
      },
    },
  );

  return supabase;
};

export type SupabaseClient = Awaited<ReturnType<typeof createSupabaseServerInstance>>;

export const DEFAULT_USER_ID = '910f8bc4-7ec5-458d-8d1c-d548a61ccee5';