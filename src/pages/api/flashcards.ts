import type { APIRoute } from 'astro';
import { FlashcardsService } from '../../lib/services/flashcards.service';
import { listFlashcardsQuerySchema, bulkCreateFlashcardsSchema } from '../../lib/schemas/flashcards.schemas';
import { z } from 'zod';

// Prevent static generation
export const prerender = false;

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const service = new FlashcardsService(locals.supabase);
    const params = listFlashcardsQuerySchema.parse(Object.fromEntries(url.searchParams));
    
    // Get user ID from session
    const userId = locals.user?.id;
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', code: 'AUTH_ERROR' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const response = await service.listFlashcards(userId, params);
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Failed to list flashcards:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to list flashcards' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const commands = bulkCreateFlashcardsSchema.parse(body);

    // Get user ID from session
    const userId = locals.user?.id;
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', code: 'AUTH_ERROR' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const service = new FlashcardsService(locals.supabase);
    const createdFlashcards = await service.bulkCreate(userId, commands);

    return new Response(JSON.stringify(createdFlashcards), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request data',
          details: error.errors,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.error('Failed to create flashcards:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create flashcards' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}; 