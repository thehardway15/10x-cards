import type { CreateGenerationCommand, GenerationCandidateDto, GenerationDetailDto } from '../../types';
import type { SupabaseClient } from '../../db/supabase.client';
import { DEFAULT_USER_ID } from '../../db/supabase.client';
import crypto from 'crypto';
import { OpenRouterService } from './openrouter.service';
import { openRouterFlashcardsArraySchema } from '../schemas/flashcard.schema';
import { z } from 'zod';

export interface GenerationResult {
  generation: GenerationDetailDto;
  candidates: GenerationCandidateDto[];
}

export class GenerationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'GenerationError';
  }
}

export class GenerationService {
  private readonly MODEL = 'openai/gpt-4o-mini';
  private readonly openRouter: OpenRouterService;

  constructor(
    private readonly supabase: SupabaseClient
  ) {
    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new GenerationError(
        'OpenRouter API key is not configured',
        'CONFIG_ERROR'
      );
    }

    this.openRouter = new OpenRouterService({ apiKey }, supabase);
  }

  async createGeneration(command: CreateGenerationCommand, userId: string): Promise<GenerationResult> {
    try {
      // Validate and sanitize source text
      const sanitizedText = this.sanitizeSourceText(command.sourceText);

      // Calculate source text hash and length
      const sourceTextHash = crypto
        .createHash('sha256')
        .update(sanitizedText)
        .digest('hex');
      
      const sourceTextLength = sanitizedText.length;

      // Create generation record
      const generationData = {
        id: crypto.randomUUID(),
        model: this.MODEL,
        generated_count: 0,
        accepted_unedited_count: 0,
        accepted_edited_count: 0,
        source_text_hash: sourceTextHash,
        source_text_length: sourceTextLength,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Insert generation record
      const { data: generation, error: insertError } = await this.supabase
        .from('generations')
        .insert(generationData)
        .select()
        .single();

      if (insertError || !generation) {
        throw new GenerationError(
          'Failed to create generation record',
          'DB_ERROR',
          insertError
        );
      }

      // Generate flashcards using OpenRouter
      const flashcards = await this.openRouter.sendMessage({
        systemMessage: `You are a helpful AI assistant that creates flashcards from educational text. 
Create 10 flashcards that capture the key concepts from the provided text.
Each flashcard should have a clear question on the front and a concise answer on the back.
Focus on the most important concepts and ensure the content is accurate.`,
        userMessage: sanitizedText,
        modelName: this.MODEL,
        modelParams: {
          temperature: 0.7,
          max_tokens: 1000
        },
        responseFormat: {
          type: 'json_schema',
          json_schema: {
            name: 'flashcards',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                flashcards: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      front: { type: 'string', description: 'Question or concept on the front of the flashcard' },
                      back: { type: 'string', description: 'Answer or explanation on the back of the flashcard' }
                    },
                    required: ['front', 'back'],
                    additionalProperties: false
                  }
                }
              },
              required: ['flashcards'],
              additionalProperties: false
            }
          }
        },
        validationSchema: z.object({
          flashcards: openRouterFlashcardsArraySchema
        }),
        sourceTextHash,
        sourceTextLength
      });

      // Update generation count
      await this.supabase
        .from('generations')
        .update({ generated_count: flashcards.flashcards.length })
        .eq('id', generation.id);

      // Map flashcards to candidates
      const candidates: GenerationCandidateDto[] = flashcards.flashcards.map(card => ({
        candidateId: crypto.randomUUID(),
        front: card.front,
        back: card.back
      }));

      // Map generation to DTO
      const generationDto: GenerationDetailDto = {
        id: generation.id,
        model: generation.model,
        generatedCount: flashcards.flashcards.length,
        acceptedUneditedCount: generation.accepted_unedited_count,
        acceptedEditedCount: generation.accepted_edited_count,
        sourceTextHash: generation.source_text_hash,
        sourceTextLength: generation.source_text_length,
        createdAt: generation.created_at
      };

      return {
        generation: generationDto,
        candidates
      };
    } catch (error) {
      if (error instanceof GenerationError) {
        await this.logError(error, this.MODEL);
        throw error;
      }

      const wrappedError = new GenerationError(
        'Unexpected error during generation',
        'INTERNAL_ERROR',
        error
      );
      await this.logError(wrappedError, this.MODEL);
      throw wrappedError;
    }
  }

  private sanitizeSourceText(text: string): string {
    return text
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      // Normalize newlines
      .replace(/\n{3,}/g, '\n\n')
      // Remove leading/trailing whitespace
      .trim()
      // Remove zero-width spaces and other invisible characters
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      // Remove control characters except newlines
      .replace(/[\x00-\x09\x0B-\x1F\x7F-\x9F]/g, '');
  }

  private async logError(error: GenerationError, model: string): Promise<void> {
    try {
      await this.supabase
        .from('generation_error_logs')
        .insert({
          model,
          error_code: error.code,
          error_message: error.message,
          source_text_hash: '',  // Required by schema
          source_text_length: 0, // Required by schema
          user_id: DEFAULT_USER_ID
        });
    } catch (e) {
      console.error('Failed to log generation error:', e);
    }
  }
} 