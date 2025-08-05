import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerInstance } from '../db/supabase.client';
import type { User } from '@supabase/supabase-js';
import { extractTokenFromHeader, verifyToken } from '../lib/auth/jwt';
import { JWTError, TokenExpiredError, InvalidTokenError, MissingTokenError } from '../lib/errors';

// Public paths that don't require authentication
const PUBLIC_PATHS = ['/', '/login', '/register', '/api/auth/login', '/api/auth/register'];

// Protected API paths that require authentication but don't need redirection
const PROTECTED_API_PATHS = ['/api/auth/change-password', '/api/auth/me', '/api/auth/logout'];

type Locals = {
  supabase: ReturnType<typeof createSupabaseServerInstance>;
  user: User | null;
};

function handleAuthError(error: unknown, isApiRoute: boolean) {
  const errorResponse = {
    error: error instanceof JWTError ? error.message : 'Unauthorized',
    code: error instanceof JWTError ? error.code : 'UNAUTHORIZED',
  };

  if (isApiRoute) {
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // For non-API routes, redirect to login
  return new Response(null, {
    status: 302,
    headers: { Location: '/login' }
  });
}

export const onRequest = defineMiddleware(async ({ request, cookies, redirect, url, locals }, next) => {
  // Create Supabase instance for this request (still needed for some operations)
  const supabase = createSupabaseServerInstance({
    headers: request.headers,
    cookies,
  });

  // Add Supabase instance to locals
  (locals as Locals).supabase = supabase;
  (locals as Locals).user = null;

  // Check if the route requires authentication
  const isPublicRoute = PUBLIC_PATHS.includes(url.pathname);
  const isProtectedApiRoute = PROTECTED_API_PATHS.includes(url.pathname);
  const isApiRoute = url.pathname.startsWith('/api/');
  const requiresAuth = !isPublicRoute;

  // For routes requiring auth, verify JWT token
  if (requiresAuth) {
    try {
      const authHeader = request.headers.get('authorization');
      if (!authHeader) {
        // Only throw error for API routes or protected routes
        // For other routes, we'll let them through and the page will handle redirection
        if (isApiRoute || isProtectedApiRoute) {
          throw new MissingTokenError();
        } else {
          // For non-API routes without auth header, skip auth check
          // The page itself will handle redirecting unauthenticated users
          return next();
        }
      }

      const token = extractTokenFromHeader(authHeader);
      const payload = await verifyToken(token).catch((error: Error) => {
        if (error.message.includes('expired')) {
          throw new TokenExpiredError();
        }
        throw new InvalidTokenError(error.message);
      });

      // Set user data from JWT payload
      (locals as Locals).user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      } as User;
    } catch (error) {
      return handleAuthError(error, isApiRoute || isProtectedApiRoute);
    }
  }

  // We'll handle client-side redirections instead of server-side to avoid loops
  // Client-side code will check localStorage for auth_token

  const response = await next();
  return response;
});