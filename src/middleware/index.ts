import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerInstance } from '../db/supabase.client';
import type { Session, User } from '@supabase/supabase-js';

// Public paths that don't require authentication
const PUBLIC_PATHS = ['/', '/login', '/register', '/api/auth/login', '/api/auth/register'];

// Protected API paths that require authentication but don't need redirection
const PROTECTED_API_PATHS = ['/api/auth/change-password', '/api/auth/me', '/api/auth/logout'];

type Locals = {
  supabase: ReturnType<typeof createSupabaseServerInstance>;
  session: Session | null;
  user: User | null;
};

export const onRequest = defineMiddleware(async ({ cookies, request, redirect, url, locals }, next) => {
  // Create Supabase instance for this request
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Add Supabase instance and auth data to locals
  (locals as Locals).supabase = supabase;
  (locals as Locals).session = null;
  (locals as Locals).user = null;

  // Get session first
  const { data: { session } } = await supabase.auth.getSession();
  (locals as Locals).session = session;

  // Then get user if we have a session
  const { data: { user } } = session 
    ? await supabase.auth.getUser()
    : { data: { user: null } };
  (locals as Locals).user = user;

  // Check if the route requires authentication
  const isPublicRoute = PUBLIC_PATHS.includes(url.pathname);
  const isProtectedApiRoute = PROTECTED_API_PATHS.includes(url.pathname);
  const isApiRoute = url.pathname.startsWith('/api/');
  const requiresAuth = !isPublicRoute;

  // Handle authentication for protected routes
  if (requiresAuth && !session) {
    if (isApiRoute || isProtectedApiRoute) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return redirect('/login');
  }

  // If user is logged in and tries to access login/register pages, redirect to /generate
  if (session && (url.pathname === '/login' || url.pathname === '/register')) {
    return redirect('/generate');
  }

  const response = await next();
  return response;
}); 