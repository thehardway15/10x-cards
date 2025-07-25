import { z } from 'zod';
import type { APIRoute } from 'astro';
import type { CreateGenerationCommand, CreateGenerationResponseDto } from '../../types';
import { GenerationService, GenerationError } from '../../lib/services/generation.service';

// Prevent static generation
export const prerender = false;

// Zod schema for request validation
const createGenerationSchema = z.object({
  sourceText: z.string()
    .min(1000, 'Source text must be at least 1000 characters')
    .max(10000, 'Source text must not exceed 10000 characters')
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = createGenerationSchema.parse(body) satisfies CreateGenerationCommand;

    // Get user ID from session
    const userId = locals.user?.id;
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', code: 'AUTH_ERROR' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize generation service
    const generationService = new GenerationService(locals.supabase);
    
    // Call generation service with user ID
    const result = await generationService.createGeneration(validatedData, userId);
    
    return new Response(
      JSON.stringify(result), 
      { 
        status: 201, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request data', 
          code: 'SCHEMA_VALIDATION_ERROR',
          details: error.errors 
        }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (error instanceof GenerationError) {
      const status = error.code === 'VALIDATION_ERROR' ? 400 : 500;
      return new Response(
        JSON.stringify({ 
          error: error.message, 
          code: error.code,
          details: error.details 
        }), 
        { status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.error('Generation endpoint error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}; 