import { CandidateListItem } from './CandidateListItem';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import type { GenerationCandidateViewModel } from '@/lib/hooks/useGeneration';

interface CandidateListProps {
  candidates: GenerationCandidateViewModel[];
  isLoading: boolean;
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onAccept: (candidateId: string) => void;
  onBulkAccept: (candidateIds: string[]) => void;
  onEdit: (candidateId: string) => void;
  onReject: (candidateId: string) => void;
}

export function CandidateList({
  candidates,
  isLoading,
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onAccept,
  onBulkAccept,
  onEdit,
  onReject,
}: CandidateListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-4">
            <Skeleton className="h-[200px] w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          No flashcard candidates available. Generate some flashcards first!
        </p>
      </div>
    );
  }

  const handleBulkAccept = () => {
    const availableCandidateIds = candidates
      .filter(c => c.status === 'idle')
      .map(c => c.candidateId);
    onBulkAccept(availableCandidateIds);
  };

  const hasAvailableCandidates = candidates.some(c => c.status === 'idle');

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          onClick={handleBulkAccept}
          disabled={!hasAvailableCandidates}
          className="gap-2"
        >
          <Check className="h-4 w-4" />
          Accept All ({candidates.filter(c => c.status === 'idle').length})
        </Button>
      </div>
      <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {candidates.map((candidate) => (
          <CandidateListItem
            key={candidate.candidateId}
            candidate={candidate}
            onAccept={onAccept}
            onEdit={onEdit}
            onReject={onReject}
          />
        ))}
      </div>
      {totalItems > pageSize && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalItems / pageSize)}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
} 