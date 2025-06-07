import { ZodError } from 'zod';
import { NotFoundError, UnauthorizedError, ValidationError } from '../errors';

interface ErrorResponse {
  error: string;
  details?: unknown;
}

export function createErrorResponse(error: unknown): Response {
  if (error instanceof ZodError) {
    return new Response(
      JSON.stringify({
        error: 'Validation failed',
        details: error.errors
      } as ErrorResponse),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  if (error instanceof NotFoundError) {
    return new Response(
      JSON.stringify({ error: error.message } as ErrorResponse),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  if (error instanceof UnauthorizedError) {
    return new Response(
      JSON.stringify({ error: error.message } as ErrorResponse),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  if (error instanceof ValidationError) {
    return new Response(
      JSON.stringify({ error: error.message } as ErrorResponse),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  console.error('Unexpected error:', error);
  return new Response(
    JSON.stringify({ error: 'Internal server error' } as ErrorResponse),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

export function createSuccessResponse<T>(data: T): Response {
  return new Response(
    JSON.stringify(data),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
} 