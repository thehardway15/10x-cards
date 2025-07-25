import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '../../../db/supabase.client';

export const GET: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return new Response(
      JSON.stringify({ error: 'Not authenticated' }),
      { status: 401 }
    );
  }

  return new Response(
    JSON.stringify({ 
      user: {
        email: user.email,
        id: user.id,
      }
    }),
    { status: 200 }
  );
}; 