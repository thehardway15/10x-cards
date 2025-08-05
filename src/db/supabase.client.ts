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
        autoRefreshToken: false, // Disable auto refresh to prevent cookie modifications after response
        persistSession: true,
        detectSessionInUrl: false,
      },
      cookies: {
        get(name) {
          return context.cookies.get(name)?.value;
        },
        set(name, value, options) {
          try {
            context.cookies.set(name, value, options);
          } catch (error) {
            // Silently handle attempts to set cookies after response has been sent
            // This prevents errors when Supabase tries to update cookies after response
            console.log(`Cookie set operation failed for ${name}, response may have already been sent`);
          }
        },
        remove(name, options) {
          try {
            context.cookies.delete(name, options);
          } catch (error) {
            // Silently handle attempts to delete cookies after response has been sent
            console.log(`Cookie delete operation failed for ${name}, response may have already been sent`);
          }
        },
      },
    },
  );

  return supabase;
};

export type SupabaseClient = Awaited<ReturnType<typeof createSupabaseServerInstance>>;