import { describe, it, expect, vi, beforeEach } from "vitest";
import { FlashcardsService } from "./flashcards.service";
import { mockSupabaseClient } from "../../test/utils/test-utils";
import type { SupabaseClient } from "@/db/supabase.client";

describe("FlashcardsService", () => {
  let flashcardsService: FlashcardsService;
  const userId = "test-user-id";

  beforeEach(() => {
    vi.resetAllMocks();
    flashcardsService = new FlashcardsService(mockSupabaseClient as unknown as SupabaseClient);
  });

  describe("listFlashcards", () => {
    it("should return paginated flashcards", async () => {
      // Arrange
      const mockResponse = {
        data: [
          {
            id: "1",
            front: "Test Question",
            back: "Test Answer",
            source: "manual",
            created_at: "2023-01-01T00:00:00Z",
          },
        ],
        count: 1,
        error: null,
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue(mockResponse),
      });

      // Act
      const result = await flashcardsService.listFlashcards(userId, {
        page: 1,
        pageSize: 10,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("flashcards");
      expect(result).toEqual({
        items: [
          {
            id: "1",
            front: "Test Question",
            back: "Test Answer",
            source: "manual",
            createdAt: "2023-01-01T00:00:00Z",
          },
        ],
        page: 1,
        pageSize: 10,
        total: 1,
      });
    });

    it("should throw error when supabase query fails", async () => {
      // Arrange
      const mockResponse = {
        data: null,
        count: null,
        error: new Error("Database error"),
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue(mockResponse),
      });

      // Act & Assert
      await expect(
        flashcardsService.listFlashcards(userId, {
          page: 1,
          pageSize: 10,
          sortBy: "createdAt",
          sortOrder: "desc",
        })
      ).rejects.toThrow("Failed to fetch flashcards");
    });
  });

  describe("bulkCreate", () => {
    it("should create multiple flashcards", async () => {
      // Arrange
      const commands = [
        { front: "Question 1", back: "Answer 1", source: "manual" as const, generationId: null },
        { front: "Question 2", back: "Answer 2", source: "ai-full" as const, generationId: "gen-1" },
      ];

      const mockResponse = {
        data: [
          { id: "1", front: "Question 1", back: "Answer 1", source: "manual", created_at: "2023-01-01T00:00:00Z" },
          { id: "2", front: "Question 2", back: "Answer 2", source: "ai-full", created_at: "2023-01-01T00:00:00Z" },
        ],
        error: null,
      };

      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue(mockResponse),
      });

      // Act
      const result = await flashcardsService.bulkCreate(userId, commands);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("flashcards");
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("1");
      expect(result[1].id).toBe("2");
    });
  });
});
