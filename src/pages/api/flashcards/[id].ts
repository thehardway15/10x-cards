import type { APIRoute } from 'astro';
import type { SupabaseClient } from '../../../db/supabase.client';
import { DEFAULT_USER_ID } from '../../../db/supabase.client';
import { FlashcardsService } from '../../../lib/services/flashcards.service';
import { flashcardParamsSchema } from '../../../lib/schemas/flashcards.schemas';
import { createErrorResponse, createSuccessResponse } from '../../../lib/utils/api.utils';
import { z } from 'zod';
import { updateFlashcardSchema, flashcardIdSchema } from '../../../lib/schemas/flashcard.schema';
import { ForbiddenError, NotFoundError, ValidationError } from '../../../lib/errors';

export const prerender = false;

interface Locals {
  supabase: SupabaseClient;
}

interface RouteParams {
  id?: string;
}

export const GET: APIRoute = async ({ params, locals }: { params: RouteParams, locals: Locals }) => {
  try {
    if (!locals.supabase) {
      throw new Error('Supabase client not available');
    }

    // Validate and parse path parameters
    const { id } = flashcardParamsSchema.parse(params);

    // Get flashcard details
    const flashcard = await FlashcardsService.getFlashcardById(
      locals.supabase,
      DEFAULT_USER_ID,
      id
    );

    return createSuccessResponse(flashcard);
  } catch (error) {
    return createErrorResponse(error);
  }
};

const deleteFlashcardParamsSchema = z.object({ id: z.string().uuid() });

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Validate the ID parameter
    const result = deleteFlashcardParamsSchema.safeParse(params);
    if (!result.success) {
      return new Response(JSON.stringify({ error: 'Invalid id' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Delete the flashcard using default user ID
    const flashcardsService = new FlashcardsService(locals.supabase);
    const deleted = await flashcardsService.deleteFlashcard(DEFAULT_USER_ID, result.data.id);

    if (!deleted) {
      return new Response(JSON.stringify({ error: 'Not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting flashcard:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    // Validate flashcard ID
    const flashcardId = await flashcardIdSchema.parseAsync(params.id).catch(() => {
      throw new ValidationError('Invalid flashcard ID');
    });

    // Parse and validate request body
    const body = await request.json().catch(() => {
      throw new ValidationError('Invalid JSON payload');
    });
    
    const command = await updateFlashcardSchema.parseAsync(body).catch((error) => {
      throw new ValidationError(error.errors[0]?.message || 'Invalid request data');
    });

    // Update flashcard using default user ID
    const flashcardService = new FlashcardsService(locals.supabase);
    await flashcardService.updateFlashcard(DEFAULT_USER_ID, flashcardId, command);

    return new Response(
      JSON.stringify({ message: 'Flashcard updated successfully' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    if (error instanceof ValidationError) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (error instanceof NotFoundError) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (error instanceof ForbiddenError) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.error('Unexpected error while updating flashcard:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}; 