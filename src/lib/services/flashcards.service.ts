import type { SupabaseClient } from "@supabase/supabase-js";
import type { ListFlashcardsQuerySchema } from "../schemas/flashcards.schemas";
import type {
  FlashcardDto,
  ListFlashcardsResponseDto,
  DetailedFlashcardDto,
  BulkCreateFlashcardsCommand,
  UpdateFlashcardCommand,
} from "../../types";
import { NotFoundError, ForbiddenError } from "../errors";
import { z } from "zod";

// Column mapping for sorting
const columnMap: Record<string, string> = {
  createdAt: "created_at",
  front: "front",
  back: "back",
};

const flashcardResponseSchema = z.object({
  id: z.string().uuid(),
  front: z.string(),
  back: z.string(),
  source: z.enum(["manual", "ai-full", "ai-edited"]),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export class FlashcardsService {
  constructor(private readonly supabase: SupabaseClient) {}

  async listFlashcards(userId: string, params: ListFlashcardsQuerySchema): Promise<ListFlashcardsResponseDto> {
    const { page, pageSize, sortBy, sortOrder } = params;
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    const query = this.supabase
      .from("flashcards")
      .select("id, front, back, source, created_at", { count: "exact" })
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .order(columnMap[sortBy], { ascending: sortOrder === "asc" })
      .range(start, end);

    const { data, count, error } = await query;

    if (error) {
      console.error("Error fetching flashcards:", error);
      throw new Error("Failed to fetch flashcards");
    }

    const items: FlashcardDto[] = data.map((card) => ({
      id: card.id,
      front: card.front,
      back: card.back,
      source: card.source,
      createdAt: card.created_at,
    }));

    return {
      items,
      page,
      pageSize,
      total: count ?? 0,
    };
  }

  static async getFlashcardById(supabase: SupabaseClient, userId: string, id: string): Promise<DetailedFlashcardDto> {
    const { data, error } = await supabase
      .from("flashcards")
      .select("id, front, back, source, created_at, updated_at")
      .eq("id", id)
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .single();

    if (error || !data) {
      throw new NotFoundError("Flashcard not found or access denied");
    }

    const validatedData = flashcardResponseSchema.parse(data);

    return {
      id: validatedData.id,
      front: validatedData.front,
      back: validatedData.back,
      source: validatedData.source,
      createdAt: validatedData.created_at,
      updatedAt: validatedData.updated_at,
    };
  }

  async bulkCreate(userId: string, commands: BulkCreateFlashcardsCommand): Promise<FlashcardDto[]> {
    // Prepare flashcards data for insertion
    const flashcardsToInsert = commands.map((command) => ({
      user_id: userId,
      front: command.front,
      back: command.back,
      source: command.source,
      generation_id: command.generationId,
      is_deleted: false,
    }));

    // Insert flashcards in a single transaction
    const { data, error } = await this.supabase
      .from("flashcards")
      .insert(flashcardsToInsert)
      .select("id, front, back, source, created_at");

    if (error) {
      console.error("Error creating flashcards:", error);
      throw new Error("Failed to create flashcards");
    }

    // Map the response to DTOs
    return data.map((card) => ({
      id: card.id,
      front: card.front,
      back: card.back,
      source: card.source,
      createdAt: card.created_at,
    }));
  }

  /**
   * Soft deletes a flashcard by setting is_deleted flag to true and updating deleted_at timestamp
   * @param userId - The ID of the user who owns the flashcard
   * @param flashcardId - The ID of the flashcard to delete
   * @returns Promise<boolean> - true if flashcard was found and deleted, false otherwise
   */
  async deleteFlashcard(userId: string, flashcardId: string): Promise<boolean> {
    const { count, error } = await this.supabase
      .from("flashcards")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .match({
        id: flashcardId,
        user_id: userId,
        is_deleted: false,
      });

    if (error) {
      console.error("Error deleting flashcard:", error);
      throw error;
    }

    return (count ?? 0) > 0;
  }

  async updateFlashcard(userId: string, flashcardId: string, command: UpdateFlashcardCommand) {
    // First check if the flashcard exists and belongs to the user
    const { data: flashcard, error: findError } = await this.supabase
      .from("flashcards")
      .select("user_id")
      .eq("id", flashcardId)
      .eq("is_deleted", false)
      .single();

    if (findError || !flashcard) {
      throw new NotFoundError("Flashcard not found");
    }

    if (flashcard.user_id !== userId) {
      throw new ForbiddenError("You do not have permission to update this flashcard");
    }

    // Update the flashcard
    const { error: updateError } = await this.supabase
      .from("flashcards")
      .update({
        front: command.front,
        back: command.back,
        updated_at: new Date().toISOString(),
      })
      .eq("id", flashcardId);

    if (updateError) {
      throw new Error("Failed to update flashcard");
    }
  }
}
