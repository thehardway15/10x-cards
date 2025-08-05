import { useState, useMemo } from 'react';
import type { 
  CreateGenerationCommand, 
  CreateGenerationResponseDto, 
  GenerationDetailDto,
  GenerationCandidateDto,
  BulkCreateFlashcardsCommand,
  FlashcardSource
} from '@/types';

export interface GenerationCandidateViewModel {
  candidateId: string;
  front: string;
  back: string;
  source: FlashcardSource;
  status: 'idle' | 'saving' | 'deleting';
}

interface GenerationState {
  status: 'idle' | 'loading' | 'success' | 'error';
  sourceText: string;
  generationDetails: GenerationDetailDto | null;
  candidates: GenerationCandidateViewModel[];
  pagination: {
    currentPage: number;
    pageSize: number;
  };
  error: string | null;
}

export function useGeneration() {
  const [state, setState] = useState<GenerationState>({
    status: 'idle',
    sourceText: '',
    generationDetails: null,
    candidates: [],
    pagination: {
      currentPage: 1,
      pageSize: 10,
    },
    error: null,
  });

  const paginatedCandidates = useMemo(() => {
    const start = (state.pagination.currentPage - 1) * state.pagination.pageSize;
    const end = start + state.pagination.pageSize;
    return state.candidates.slice(start, end);
  }, [state.candidates, state.pagination]);

  const handleSourceTextChange = (text: string) => {
    setState(prev => ({ ...prev, sourceText: text }));
  };

  const handleGenerate = async () => {
    setState(prev => ({ ...prev, status: 'loading', error: null }));

    try {
      const response = await fetch('/api/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceText: state.sourceText } as CreateGenerationCommand),
      });

      if (!response.ok) {
        throw new Error('Failed to generate flashcards');
      }

      const data = await response.json() as CreateGenerationResponseDto;
      
      setState(prev => ({
        ...prev,
        status: 'success',
        generationDetails: data.generation,
        candidates: data.candidates.map(candidate => ({
          ...candidate,
          source: 'ai-full' as FlashcardSource,
          status: 'idle',
        })),
        pagination: { ...prev.pagination, currentPage: 1 },
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      }));
    }
  };

  const handleAccept = async (candidateId: string) => {
    const candidate = state.candidates.find(c => c.candidateId === candidateId);
    if (!candidate || !state.generationDetails) return;

    setState(prev => ({
      ...prev,
      candidates: prev.candidates.map(c => 
        c.candidateId === candidateId ? { ...c, status: 'saving' } : c
      ),
    }));

    try {
      const command: BulkCreateFlashcardsCommand = [{
        front: candidate.front,
        back: candidate.back,
        source: candidate.source,
        generationId: state.generationDetails.id,
      }];

      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        throw new Error('Failed to save flashcard');
      }

      setState(prev => ({
        ...prev,
        candidates: prev.candidates.filter(c => c.candidateId !== candidateId),
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        candidates: prev.candidates.map(c => 
          c.candidateId === candidateId ? { ...c, status: 'idle' } : c
        ),
        error: error instanceof Error ? error.message : 'Failed to save flashcard',
      }));
    }
  };

  const handleEdit = (updatedCandidate: GenerationCandidateViewModel) => {
    setState(prev => ({
      ...prev,
      candidates: prev.candidates.map(c => 
        c.candidateId === updatedCandidate.candidateId 
          ? { ...updatedCandidate, source: 'ai-edited' as FlashcardSource } 
          : c
      ),
    }));
  };

  const handleReject = (candidateId: string) => {
    setState(prev => ({
      ...prev,
      candidates: prev.candidates.filter(c => c.candidateId !== candidateId),
    }));
  };

  const setPage = (pageNumber: number) => {
    setState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, currentPage: pageNumber },
    }));
  };

  return {
    sourceText: state.sourceText,
    status: state.status,
    error: state.error,
    candidates: paginatedCandidates,
    totalCandidates: state.candidates.length,
    currentPage: state.pagination.currentPage,
    pageSize: state.pagination.pageSize,
    handleSourceTextChange,
    handleGenerate,
    handleAccept,
    handleEdit,
    handleReject,
    setPage,
  };
} 