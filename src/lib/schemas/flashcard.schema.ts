import { z } from "zod";

// Schema for validating flashcard update requests
export const updateFlashcardSchema = z.object({
  front: z.string().min(1, "Front content is required").max(200, "Front content must not exceed 200 characters"),
  back: z.string().min(1, "Back content is required").max(500, "Back content must not exceed 500 characters"),
});

// Type inference from the schema
export type UpdateFlashcardInput = z.infer<typeof updateFlashcardSchema>;

// Schema for validating UUID path parameter
export const flashcardIdSchema = z.string().uuid("Invalid flashcard ID format");

// Schema for validating OpenRouter flashcard generation responses
export const openRouterFlashcardSchema = z.object({
  front: z.string().min(1, "Front content is required").max(200, "Front content must not exceed 200 characters").trim(),
  back: z.string().min(1, "Back content is required").max(500, "Back content must not exceed 500 characters").trim(),
});

export const openRouterFlashcardsArraySchema = z
  .array(openRouterFlashcardSchema)
  .min(1, "At least one flashcard is required")
  .max(10, "Maximum 10 flashcards allowed per generation");
