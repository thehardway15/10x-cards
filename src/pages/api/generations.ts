import type { APIRoute } from 'astro';
import { z } from 'zod';

const generationRequestSchema = z.object({
  sourceText: z.string().min(1, 'Source text is required'),
  options: z.object({
    language: z.string().optional(),
    difficulty: z.string().optional(),
    count: z.number().min(1).max(10).optional(),
  }).optional(),
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const body = await request.json();
    const { sourceText, options } = generationRequestSchema.parse(body);

    const { supabase } = locals;
    
    // Create generation record
    const { data: generation, error: generationError } = await supabase
      .from('generations')
      .insert({
        user_id: user.id,
        source_text: sourceText,
        options,
        status: 'pending',
      })
      .select()
      .single();

    if (generationError) {
      throw generationError;
    }

    // Start generation process (implementation depends on your setup)
    // ...

    return new Response(
      JSON.stringify({ generation }),
      { 
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: error.errors[0].message }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

export const GET: APIRoute = async ({ locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const { supabase } = locals;
    const { data: generations, error } = await supabase
      .from('generations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ generations }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};