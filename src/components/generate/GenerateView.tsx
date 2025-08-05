import { useState } from 'react';
import { useGeneration, type GenerationCandidateViewModel } from '@/lib/hooks/useGeneration';
import { SourceTextInput } from './SourceTextInput';
import { CandidateList } from './CandidateList';
import { EditFlashcardModal } from './EditFlashcardModal';
import { ConfirmActionDialog } from './ConfirmActionDialog';
import { toast } from 'sonner';

export function GenerateView() {
  const {
    sourceText,
    status,
    error: generationError,
    candidates,
    totalCandidates,
    currentPage,
    pageSize,
    isValidSourceText,
    handleSourceTextChange,
    handleGenerate,
    handleAccept,
    handleEdit,
    handleReject,
    setPage,
  } = useGeneration();

  const [editingCandidate, setEditingCandidate] = useState<GenerationCandidateViewModel | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rejectingCandidateId, setRejectingCandidateId] = useState<string | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const onAcceptCandidate = (candidateId: string) => {
    handleAccept(candidateId)
      .then(() => toast.success('Flashcard saved successfully!'))
      .catch(() => toast.error('Failed to save flashcard'));
  };

  const onBulkAcceptCandidates = async (candidateIds: string[]) => {
    let successCount = 0;
    let failureCount = 0;

    // Show loading toast
    const loadingToast = toast.loading(`Accepting ${candidateIds.length} flashcards...`);

    // Process each candidate sequentially
    for (const candidateId of candidateIds) {
      try {
        await handleAccept(candidateId);
        successCount++;
      } catch {
        failureCount++;
      }
    }

    // Dismiss loading toast
    toast.dismiss(loadingToast);

    // Show result toast
    if (successCount > 0) {
      toast.success(`Successfully saved ${successCount} flashcard${successCount !== 1 ? 's' : ''}`);
    }
    if (failureCount > 0) {
      toast.error(`Failed to save ${failureCount} flashcard${failureCount !== 1 ? 's' : ''}`);
    }
  };

  const onEditCandidate = (candidateId: string) => {
    const candidate = candidates.find((c) => c.candidateId === candidateId);
    if (candidate) {
      setEditingCandidate(candidate);
      setIsEditModalOpen(true);
    }
  };

  const onSaveEdit = (updatedCandidate: GenerationCandidateViewModel) => {
    handleEdit(updatedCandidate);
    toast.success('Flashcard updated successfully!');
  };

  const onRejectCandidate = (candidateId: string) => {
    setRejectingCandidateId(candidateId);
    setIsConfirmDialogOpen(true);
  };

  const onConfirmReject = () => {
    if (rejectingCandidateId) {
      handleReject(rejectingCandidateId);
      setRejectingCandidateId(null);
      setIsConfirmDialogOpen(false);
      toast.success('Flashcard rejected');
    }
  };

  return (
    <div className="space-y-8">
      <SourceTextInput
        data-testid="source-text-input"
        sourceText={sourceText}
        onSourceTextChange={handleSourceTextChange}
        onSubmit={handleGenerate}
        isLoading={status === 'loading'}
        charCount={sourceText.length}
        isValid={isValidSourceText}
      />

      {generationError && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md">
          <p>{generationError}</p>
        </div>
      )}

      <CandidateList
        candidates={candidates}
        isLoading={status === 'loading'}
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={totalCandidates}
        onPageChange={setPage}
        onAccept={onAcceptCandidate}
        onBulkAccept={onBulkAcceptCandidates}
        onEdit={onEditCandidate}
        onReject={onRejectCandidate}
      />

      <EditFlashcardModal
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        candidate={editingCandidate}
        onSave={onSaveEdit}
      />

      <ConfirmActionDialog
        isOpen={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        onConfirm={onConfirmReject}
      />
    </div>
  );
} 