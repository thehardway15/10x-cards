import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGeneration } from "../useGeneration";
import type { GenerationCandidateViewModel } from "../useGeneration";

// Mock fetch globally
vi.stubGlobal("fetch", vi.fn());

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("useGeneration Hook", () => {
  // Mock data for tests
  const mockGenerationResponse = {
    generation: { id: "gen-123", sourceText: "Some source text" },
    candidates: [
      {
        candidateId: "c1",
        front: "Front 1",
        back: "Back 1",
      },
      {
        candidateId: "c2",
        front: "Front 2",
        back: "Back 2",
      },
    ],
  };

  // Reset mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage to return a valid token
    localStorageMock.getItem.mockReturnValue("mock-token");
    // Default success response for fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockGenerationResponse,
    });
  });

  it("initializes with default state", () => {
    const { result } = renderHook(() => useGeneration());

    expect(result.current.sourceText).toBe("");
    expect(result.current.status).toBe("idle");
    expect(result.current.candidates).toEqual([]);
    expect(result.current.currentPage).toBe(1);
    expect(result.current.error).toBeNull();
  });

  it("updates sourceText when handleSourceTextChange is called", () => {
    const { result } = renderHook(() => useGeneration());

    act(() => {
      result.current.handleSourceTextChange("New source text");
    });

    expect(result.current.sourceText).toBe("New source text");
  });

  it("fetches generation data when handleGenerate is called", async () => {
    const { result } = renderHook(() => useGeneration());

    // Set source text
    act(() => {
      result.current.handleSourceTextChange("a".repeat(1000));
    });

    // Call generate
    await act(async () => {
      await result.current.handleGenerate();
    });

    // Verify fetch was called with correct params
    expect(fetch).toHaveBeenCalledWith("/api/generations", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": "Bearer mock-token"
      },
      body: JSON.stringify({ sourceText: "a".repeat(1000) }),
    });

    // Verify state updates
    expect(result.current.status).toBe("success");
    expect(result.current.candidates).toHaveLength(2);
    expect(result.current.candidates[0]).toMatchObject({
      candidateId: "c1",
      front: "Front 1",
      back: "Back 1",
      source: "ai-full",
      status: "idle",
    });
  });

  it("handles API errors during generation", async () => {
    // Mock a failed API response
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Server Error",
      json: async () => ({ error: "Server Error" }),
    });

    const { result } = renderHook(() => useGeneration());

    // Set source text
    act(() => {
      result.current.handleSourceTextChange("a".repeat(1000));
    });

    // Call generate
    await act(async () => {
      await result.current.handleGenerate();
    });

    // Verify error state
    expect(result.current.status).toBe("error");
    expect(result.current.error).toBe("Server Error");
  });

  it("handles missing authentication token", async () => {
    // Mock localStorage to return null (no token)
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useGeneration());

    // Set source text
    act(() => {
      result.current.handleSourceTextChange("a".repeat(1000));
    });

    // Call generate
    await act(async () => {
      await result.current.handleGenerate();
    });

    // Verify error state
    expect(result.current.status).toBe("error");
    expect(result.current.error).toBe("No authentication token found");
  });

  it("paginates candidates correctly", async () => {
    // Create many candidates for pagination
    const manyCandidates = Array.from({ length: 15 }).map((_, i) => ({
      candidateId: `c${i}`,
      front: `Front ${i}`,
      back: `Back ${i}`,
    }));

    // Mock response with many candidates
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        generation: { id: "gen-123", sourceText: "Some source text" },
        candidates: manyCandidates,
      }),
    });

    const { result } = renderHook(() => useGeneration());

    // Set valid source text and generate
    act(() => {
      result.current.handleSourceTextChange("a".repeat(1000));
    });

    await act(async () => {
      await result.current.handleGenerate();
    });

    // First page should have pageSize items
    expect(result.current.candidates.length).toBe(10); // Default page size
    expect(result.current.totalCandidates).toBe(15);

    // Change page
    act(() => {
      result.current.setPage(2);
    });

    // Second page should have remaining 5 items
    expect(result.current.candidates.length).toBe(5);
    expect(result.current.currentPage).toBe(2);
  });

  it("handles accept candidate correctly", async () => {
    const { result } = renderHook(() => useGeneration());

    // Setup initial state with candidates
    act(() => {
      result.current.handleSourceTextChange("a".repeat(1000));
    });

    await act(async () => {
      await result.current.handleGenerate();
    });

    // Clear fetch mock to track new calls
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    // Accept the first candidate
    await act(async () => {
      await result.current.handleAccept("c1");
    });

    // Verify fetch was called correctly
    expect(fetch).toHaveBeenCalledWith("/api/flashcards", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": "Bearer mock-token"
      },
      body: expect.any(String),
    });

    // The candidate should be removed from the list
    expect(result.current.candidates.find((c) => c.candidateId === "c1")).toBeUndefined();
    expect(result.current.candidates.length).toBe(1);
  });

  it("handles rejection of candidates", async () => {
    const { result } = renderHook(() => useGeneration());

    // Setup initial state with candidates
    act(() => {
      result.current.handleSourceTextChange("a".repeat(1000));
    });

    await act(async () => {
      await result.current.handleGenerate();
    });

    // Reject a candidate
    act(() => {
      result.current.handleReject("c1");
    });

    // Candidate should be removed
    expect(result.current.candidates.find((c) => c.candidateId === "c1")).toBeUndefined();
    expect(result.current.candidates.length).toBe(1);
  });

  it("handles editing of candidates", async () => {
    const { result } = renderHook(() => useGeneration());

    // Setup initial state with candidates
    act(() => {
      result.current.handleSourceTextChange("a".repeat(1000));
    });

    await act(async () => {
      await result.current.handleGenerate();
    });

    // Edit a candidate
    const updatedCandidate: GenerationCandidateViewModel = {
      candidateId: "c1",
      front: "Updated Front",
      back: "Updated Back",
      source: "ai-full",
      status: "idle",
    };

    act(() => {
      result.current.handleEdit(updatedCandidate);
    });

    // Verify candidate was updated and marked as edited
    const editedCandidate = result.current.candidates.find((c) => c.candidateId === "c1");
    expect(editedCandidate?.front).toBe("Updated Front");
    expect(editedCandidate?.back).toBe("Updated Back");
    expect(editedCandidate?.source).toBe("ai-edited");
  });

  it("handles API error during accept", async () => {
    const { result } = renderHook(() => useGeneration());

    // Setup initial state with candidates
    act(() => {
      result.current.handleSourceTextChange("a".repeat(1000));
    });

    await act(async () => {
      await result.current.handleGenerate();
    });

    // Mock a failed API response
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    // Try to accept a candidate
    await act(async () => {
      await result.current.handleAccept("c1");
    });

    // Candidate should still exist and have idle status
    const candidate = result.current.candidates.find((c) => c.candidateId === "c1");
    expect(candidate).toBeDefined();
    expect(candidate?.status).toBe("idle");
    expect(result.current.error).toBeTruthy();
  });
});
