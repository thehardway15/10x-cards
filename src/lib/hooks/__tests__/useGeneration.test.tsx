import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGeneration } from '../useGeneration';
import type { GenerationCandidateViewModel } from '../useGeneration';

// Mock fetch globally
vi.stubGlobal('fetch', vi.fn());

describe('useGeneration Hook', () => {
  // Mock data for tests
  const mockGenerationResponse = {
    generation: { id: 'gen-123', sourceText: 'Some source text' },
    candidates: [
      {
        candidateId: 'c1',
        front: 'Front 1',
        back: 'Back 1'
      },
      {
        candidateId: 'c2',
        front: 'Front 2',
        back: 'Back 2'
      }
    ]
  };

  // Reset mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
    // Default success response for fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockGenerationResponse
    });
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useGeneration());
    
    expect(result.current.sourceText).toBe('');
    expect(result.current.status).toBe('idle');
    expect(result.current.candidates).toEqual([]);
    expect(result.current.currentPage).toBe(1);
    expect(result.current.error).toBeNull();
    expect(result.current.isValidSourceText).toBe(false);
  });

  it('updates sourceText when handleSourceTextChange is called', () => {
    const { result } = renderHook(() => useGeneration());
    
    act(() => {
      result.current.handleSourceTextChange('New source text');
    });
    
    expect(result.current.sourceText).toBe('New source text');
  });

  it('validates sourceText length correctly', () => {
    const { result } = renderHook(() => useGeneration());
    
    // Too short
    act(() => {
      result.current.handleSourceTextChange('short');
    });
    expect(result.current.isValidSourceText).toBe(false);
    
    // Valid length
    act(() => {
      result.current.handleSourceTextChange('a'.repeat(1000));
    });
    expect(result.current.isValidSourceText).toBe(true);
    
    // Too long
    act(() => {
      result.current.handleSourceTextChange('a'.repeat(10001));
    });
    expect(result.current.isValidSourceText).toBe(false);
  });

  it('fetches generation data when handleGenerate is called', async () => {
    const { result } = renderHook(() => useGeneration());
    
    // Set valid source text
    act(() => {
      result.current.handleSourceTextChange('a'.repeat(1000));
    });
    
    // Call generate
    await act(async () => {
      await result.current.handleGenerate();
    });
    
    // Verify fetch was called with correct params
    expect(fetch).toHaveBeenCalledWith('/api/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceText: 'a'.repeat(1000) }),
    });
    
    // Verify state updates
    expect(result.current.status).toBe('success');
    expect(result.current.candidates).toHaveLength(2);
    expect(result.current.candidates[0]).toMatchObject({
      candidateId: 'c1',
      front: 'Front 1',
      back: 'Back 1',
      source: 'ai-full',
      status: 'idle'
    });
  });

  it('handles API errors during generation', async () => {
    // Mock a failed API response
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error'
    });
    
    const { result } = renderHook(() => useGeneration());
    
    // Set valid source text
    act(() => {
      result.current.handleSourceTextChange('a'.repeat(1000));
    });
    
    // Call generate
    await act(async () => {
      await result.current.handleGenerate();
    });
    
    // Verify error state
    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('Failed to generate flashcards');
  });

  it('paginates candidates correctly', async () => {
    // Create many candidates for pagination
    const manyCandidates = Array.from({ length: 15 }).map((_, i) => ({
      candidateId: `c${i}`,
      front: `Front ${i}`,
      back: `Back ${i}`
    }));
    
    // Mock response with many candidates
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        generation: { id: 'gen-123', sourceText: 'Some source text' },
        candidates: manyCandidates
      })
    });
    
    const { result } = renderHook(() => useGeneration());
    
    // Set valid source text and generate
    act(() => {
      result.current.handleSourceTextChange('a'.repeat(1000));
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

  it('handles accept candidate correctly', async () => {
    const { result } = renderHook(() => useGeneration());
    
    // Setup initial state with candidates
    act(() => {
      result.current.handleSourceTextChange('a'.repeat(1000));
    });
    
    await act(async () => {
      await result.current.handleGenerate();
    });
    
    // Clear fetch mock to track new calls
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({})
    });
    
    // Accept the first candidate
    await act(async () => {
      await result.current.handleAccept('c1');
    });
    
    // Verify fetch was called correctly
    expect(fetch).toHaveBeenCalledWith('/api/flashcards', expect.any(Object));
    
    // The candidate should be removed from the list
    expect(result.current.candidates.find(c => c.candidateId === 'c1')).toBeUndefined();
    expect(result.current.candidates.length).toBe(1);
  });

  it('handles rejection of candidates', async () => {
    const { result } = renderHook(() => useGeneration());
    
    // Setup initial state with candidates
    act(() => {
      result.current.handleSourceTextChange('a'.repeat(1000));
    });
    
    await act(async () => {
      await result.current.handleGenerate();
    });
    
    // Reject a candidate
    act(() => {
      result.current.handleReject('c1');
    });
    
    // Candidate should be removed
    expect(result.current.candidates.find(c => c.candidateId === 'c1')).toBeUndefined();
    expect(result.current.candidates.length).toBe(1);
  });

  it('handles editing of candidates', async () => {
    const { result } = renderHook(() => useGeneration());
    
    // Setup initial state with candidates
    act(() => {
      result.current.handleSourceTextChange('a'.repeat(1000));
    });
    
    await act(async () => {
      await result.current.handleGenerate();
    });
    
    // Edit a candidate
    const updatedCandidate: GenerationCandidateViewModel = {
      candidateId: 'c1',
      front: 'Updated Front',
      back: 'Updated Back',
      source: 'ai-full',
      status: 'idle'
    };
    
    act(() => {
      result.current.handleEdit(updatedCandidate);
    });
    
    // Verify candidate was updated and marked as edited
    const editedCandidate = result.current.candidates.find(c => c.candidateId === 'c1');
    expect(editedCandidate?.front).toBe('Updated Front');
    expect(editedCandidate?.back).toBe('Updated Back');
    expect(editedCandidate?.source).toBe('ai-edited');
  });

  it('handles API error during accept', async () => {
    const { result } = renderHook(() => useGeneration());
    
    // Setup initial state with candidates
    act(() => {
      result.current.handleSourceTextChange('a'.repeat(1000));
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
      await result.current.handleAccept('c1');
    });
    
    // Candidate should still exist and have idle status
    const candidate = result.current.candidates.find(c => c.candidateId === 'c1');
    expect(candidate).toBeDefined();
    expect(candidate?.status).toBe('idle');
    expect(result.current.error).toBeTruthy();
  });
}); 