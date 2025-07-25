import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerInstance } from '../db/supabase.client';

// Public paths that don't require authentication
const PUBLIC_PATHS = ['/', '/login', '/register', '/api/auth/login'];

export const onRequest = defineMiddleware(async ({ cookies, request, redirect, url, locals }, next) => {
  // Create Supabase instance for this request
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Get session first
  const { data: { session } } = await supabase.auth.getSession();

  // Then get user if we have a session
  const { data: { user } } = session 
    ? await supabase.auth.getUser()
    : { data: { user: null } };

  // Check if the route requires authentication
  const isProtectedRoute = !PUBLIC_PATHS.includes(url.pathname);
  const isApiRoute = url.pathname.startsWith('/api/');

  // Handle authentication for protected routes
  if (isProtectedRoute && !session) {
    if (isApiRoute) {
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