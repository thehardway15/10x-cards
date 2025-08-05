import { z } from 'zod';

export const flashcardSchema = z.object({
  front: z.string()
    .min(1, 'Front side cannot be empty')
    .max(200, 'Front side cannot exceed 200 characters'),
  back: z.string()
    .min(1, 'Back side cannot be empty')
    .max(500, 'Back side cannot exceed 500 characters')
});

export const sourceTextSchema = z.object({
  sourceText: z.string()
    .min(1000, 'Text must be at least 1,000 characters')
    .max(10000, 'Text must not exceed 10,000 characters')
});

export type FlashcardFormData = z.infer<typeof flashcardSchema>;
export type SourceTextFormData = z.infer<typeof sourceTextSchema>; 