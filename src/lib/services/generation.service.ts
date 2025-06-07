import type { CreateGenerationCommand, GenerationCandidateDto, GenerationDetailDto } from '../../types';
import type { SupabaseClient } from '../../db/supabase.client';
import { DEFAULT_USER_ID } from '../../db/supabase.client';
import crypto from 'crypto';

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
  private readonly MODEL = 'gpt-4-1106-preview';

  constructor(private readonly supabase: SupabaseClient) {}

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

      // Mock generation data
      const generationData = {
        id: crypto.randomUUID(),
        model: this.MODEL,
        generated_count: 3,
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

      // Mock candidates
      const candidates: GenerationCandidateDto[] = [
        {
          candidateId: crypto.randomUUID(),
          front: 'What is TypeScript?',
          back: 'TypeScript is a strongly typed programming language that builds on JavaScript.'
        },
        {
          candidateId: crypto.randomUUID(),
          front: 'What are TypeScript interfaces?',
          back: 'Interfaces in TypeScript define contracts in your code and provide explicit names for type checking.'
        },
        {
          candidateId: crypto.randomUUID(),
          front: 'What is type inference in TypeScript?',
          back: 'Type inference is TypeScript\'s ability to automatically determine types when they are not explicitly specified.'
        }
      ];

      // Map generation to DTO
      const generationDto: GenerationDetailDto = {
        id: generation.id,
        model: generation.model,
        generatedCount: generation.generated_count,
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