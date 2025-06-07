import type { APIRoute } from 'astro';
import { FlashcardsService } from '../../lib/services/flashcards.service';
import { bulkCreateFlashcardsSchema, listFlashcardsQuerySchema } from '../../lib/schemas/flashcards.schemas';
import { ValidationError } from '../../lib/errors';
import type { ZodError } from 'zod';
import { DEFAULT_USER_ID } from '../../db/supabase.client';

export const prerender = false;

// GET /api/flashcards - List flashcards
export const GET: APIRoute = async ({ locals, url }) => {
  try {
    const { supabase } = locals;
    const params = listFlashcardsQuerySchema.parse(Object.fromEntries(url.searchParams));
    const service = new FlashcardsService(supabase);
    const response = await service.listFlashcards(DEFAULT_USER_ID, params);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    if (error instanceof Error && 'errors' in error) {
      // Zod validation error
      return new Response(JSON.stringify({ 
        message: 'Validation error',
        errors: (error as ZodError).errors 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.error('Error listing flashcards:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST /api/flashcards - Create flashcards in bulk
export const POST: APIRoute = async ({ locals, request }) => {
  try {
    const { supabase } = locals;

    // Parse and validate request body
    const body = await request.json();
    const commands = bulkCreateFlashcardsSchema.parse(body);

    // Verify generationId ownership for AI-generated flashcards
    const aiFlashcards = commands.filter(cmd => cmd.source !== 'manual');
    if (aiFlashcards.length > 0) {
      const generationIds = aiFlashcards
        .map(cmd => cmd.generationId)
        .filter((id): id is string => id !== undefined);

      const { count } = await supabase
        .from('generations')
        .select('id', { count: 'exact' })
        .eq('user_id', DEFAULT_USER_ID)
        .in('id', generationIds);

      if (count !== generationIds.length) {
        throw new ValidationError('Invalid or inaccessible generation ID');
      }
    }

    // Create flashcards
    const service = new FlashcardsService(supabase);
    const createdFlashcards = await service.bulkCreate(DEFAULT_USER_ID, commands);

    return new Response(JSON.stringify({ items: createdFlashcards }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return new Response(JSON.stringify({ message: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (error instanceof Error && 'errors' in error) {
      // Zod validation error
      return new Response(JSON.stringify({ 
        message: 'Validation error',
        errors: (error as ZodError).errors 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.error('Error creating flashcards:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 