import { z } from 'zod';

// Schema for list flashcards query parameters
export const listFlashcardsQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1)
    .optional()
    .default(1)
    .describe('Page number (min: 1)'),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(20)
    .describe('Items per page (max: 100)'),
  sortBy: z.enum(['createdAt', 'front', 'back'])
    .optional()
    .default('createdAt')
    .describe('Field to sort by'),
  sortOrder: z.enum(['asc', 'desc'])
    .optional()
    .default('asc')
    .describe('Sort direction')
});

// Type inference
export type ListFlashcardsQuerySchema = z.infer<typeof listFlashcardsQuerySchema>;

export const flashcardParamsSchema = z.object({
  id: z.string().uuid('Invalid flashcard ID format')
}); 

// Schema for creating a single flashcard
export const createFlashcardSchema = z.object({
  front: z.string()
    .min(1, 'Front content is required')
    .max(200, 'Front content must not exceed 200 characters')
    .trim(),
  back: z.string()
    .min(1, 'Back content is required')
    .max(500, 'Back content must not exceed 500 characters')
    .trim(),
  source: z.enum(['manual', 'ai-full', 'ai-edited'], {
    errorMap: () => ({ message: 'Invalid flashcard source' })
  }),
  generationId: z.string()
    .uuid('Invalid generation ID format')
    .optional()
}).refine(
  (data) => {
    if (data.source !== 'manual' && !data.generationId) {
      return false;
    }
    return true;
  },
  {
    message: 'Generation ID is required for AI-generated flashcards',
    path: ['generationId']
  }
);

// Schema for bulk creating flashcards
export const bulkCreateFlashcardsSchema = z.array(createFlashcardSchema)
  .min(1, 'At least one flashcard is required')
  .max(100, 'Cannot create more than 100 flashcards at once');

// Type inference
export type CreateFlashcardSchema = z.infer<typeof createFlashcardSchema>;
export type BulkCreateFlashcardsSchema = z.infer<typeof bulkCreateFlashcardsSchema>; 