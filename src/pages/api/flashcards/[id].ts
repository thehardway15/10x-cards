import type { APIRoute } from 'astro';
import { FlashcardsService } from '../../../lib/services/flashcards.service';
import { flashcardParamsSchema } from '../../../lib/schemas/flashcards.schemas';
import { updateFlashcardSchema } from '../../../lib/schemas/flashcard.schema';
import { z } from 'zod';

// Prevent static generation
export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Validate flashcard ID
    const { id } = flashcardParamsSchema.parse(params);

    // Get user ID from session
    const userId = locals.user?.id;
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', code: 'AUTH_ERROR' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get flashcard
    const service = new FlashcardsService(locals.supabase);
    const flashcard = await service.getFlashcard(userId, id);

    if (!flashcard) {
      return new Response(
        JSON.stringify({ error: 'Flashcard not found' }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(flashcard), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Invalid flashcard ID' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.error('Failed to get flashcard:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get flashcard' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // Validate flashcard ID
    const { id } = flashcardParamsSchema.parse(params);

    // Get user ID from session
    const userId = locals.user?.id;
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', code: 'AUTH_ERROR' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Delete flashcard
    const service = new FlashcardsService(locals.supabase);
    const deleted = await service.deleteFlashcard(userId, id);

    if (!deleted) {
      return new Response(
        JSON.stringify({ error: 'Flashcard not found' }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Invalid flashcard ID' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.error('Failed to delete flashcard:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete flashcard' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    // Validate flashcard ID
    const { id } = flashcardParamsSchema.parse(params);

    // Get user ID from session
    const userId = locals.user?.id;
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', code: 'AUTH_ERROR' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const command = updateFlashcardSchema.parse(body);

    // Update flashcard
    const service = new FlashcardsService(locals.supabase);
    const updated = await service.updateFlashcard(userId, id, command);

    if (!updated) {
      return new Response(
        JSON.stringify({ error: 'Flashcard not found' }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request data',
          details: error.errors 
        }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.error('Failed to update flashcard:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update flashcard' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}; 