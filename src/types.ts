import type { Tables, Enums } from './db/database.types';

// Flashcard Source enumeration
export type FlashcardSource = Enums<'flashcard_source'>;

// Common pagination and sorting options
export interface PaginationOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// #### Generation DTOs and Commands

// Summary view of a generation session
export interface GenerationSummaryDto {
  id: Tables<'generations'>['id'];
  model: Tables<'generations'>['model'];
  generatedCount: Tables<'generations'>['generated_count'];
  acceptedUneditedCount: Tables<'generations'>['accepted_unedited_count'];
  acceptedEditedCount: Tables<'generations'>['accepted_edited_count'];
  createdAt: Tables<'generations'>['created_at'];
}

// Detailed view including source text metadata
export interface GenerationDetailDto extends GenerationSummaryDto {
  sourceTextHash: Tables<'generations'>['source_text_hash'];
  sourceTextLength: Tables<'generations'>['source_text_length'];
}

// Candidate for flashcard generation
export interface GenerationCandidateDto {
  candidateId: string; // ephemeral identifier for the candidate
  front: Tables<'flashcards'>['front'];
  back: Tables<'flashcards'>['back'];
}

// Command to create a new generation session
export interface CreateGenerationCommand {
  sourceText: string; // 1000-10000 characters
}

// Response for creating or retrying a generation session
export interface CreateGenerationResponseDto {
  generation: GenerationDetailDto;
  candidates: GenerationCandidateDto[];
}

// Alias for retry endpoint response
export type RetryGenerationResponseDto = CreateGenerationResponseDto;

// Query parameters for listing generation sessions
export interface ListGenerationsQueryDto extends PaginationOptions {}

// Response for listing generation sessions
export interface ListGenerationsResponseDto {
  items: GenerationSummaryDto[];
  page: number;
  pageSize: number;
  total: number;
}

// Response for retrieving a single generation session
export type GetGenerationResponseDto = GenerationSummaryDto;

// #### Flashcard DTOs and Commands

// Basic flashcard view
export interface FlashcardDto {
  id: Tables<'flashcards'>['id'];
  front: Tables<'flashcards'>['front'];
  back: Tables<'flashcards'>['back'];
  source: FlashcardSource;
  createdAt: Tables<'flashcards'>['created_at'];
}

// Detailed flashcard view including update timestamp
export interface DetailedFlashcardDto extends FlashcardDto {
  updatedAt: Tables<'flashcards'>['updated_at'];
}

// Query parameters for listing flashcards
export interface ListFlashcardsQueryDto extends PaginationOptions {}

// Response for listing flashcards
export interface ListFlashcardsResponseDto {
  items: FlashcardDto[];
  page: number;
  pageSize: number;
  total: number;
}

// Response for retrieving a single flashcard
export type GetFlashcardResponseDto = DetailedFlashcardDto;

// Command to create a flashcard (manual or accepting AI candidate)
export interface CreateFlashcardCommand {
  front: Tables<'flashcards'>['front'];
  back: Tables<'flashcards'>['back'];
  source: FlashcardSource;
  generationId?: Tables<'flashcards'>['generation_id']; // required if source != 'manual'
}

// Command to create multiple flashcards in bulk
export type BulkCreateFlashcardsCommand = CreateFlashcardCommand[];

// Response for bulk creating flashcards
export interface BulkCreateFlashcardsResponseDto {
  items: FlashcardDto[];
}

// Command to update an existing flashcard
export interface UpdateFlashcardCommand {
  front: Tables<'flashcards'>['front'];
  back: Tables<'flashcards'>['back'];
}

// Response after updating a flashcard
export interface UpdateFlashcardResponseDto {
  message: string;
}

// #### Generation Error Log DTOs

// Representation of an AI generation error log entry
export interface GenerationErrorLogDto {
  id: Tables<'generation_error_logs'>['id'];
  model: Tables<'generation_error_logs'>['model'];
  errorCode: Tables<'generation_error_logs'>['error_code'];
  errorMessage: Tables<'generation_error_logs'>['error_message'];
  createdAt: Tables<'generation_error_logs'>['created_at'];
}

// Query parameters for listing error logs
export interface ListGenerationErrorLogsQueryDto extends PaginationOptions {}

// Response for listing generation error logs
export interface ListGenerationErrorLogsResponseDto {
  items: GenerationErrorLogDto[];
  page: number;
  pageSize: number;
  total: number;
}

// #### Repetition Import DTOs and Commands

// Command to import flashcards into spaced-repetition module
export interface ImportRepetitionsCommand {
  flashcardIds: string[];
}

// Response after importing flashcards into repetition module
export interface ImportRepetitionsResponseDto {
  importedCount: number;
}

// #### OpenRouter Types

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterJsonSchema {
  name: string;
  strict: boolean;
  schema: Record<string, unknown>;
}

export interface OpenRouterResponseFormat {
  type: 'json_schema';
  json_schema: OpenRouterJsonSchema;
}

export interface OpenRouterRequest {
  messages: OpenRouterMessage[];
  model: string;
  response_format?: OpenRouterResponseFormat;
  parameters?: {
    temperature?: number;
    max_tokens?: number;
    [key: string]: unknown;
  };
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    message: OpenRouterMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenRouterServiceOptions {
  apiKey: string;
  endpoint?: string;
  defaultModel?: string;
  defaultParams?: Record<string, unknown>;
} 