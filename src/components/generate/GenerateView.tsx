import { useState } from 'react';
import { useGeneration, type GenerationCandidateViewModel } from '@/lib/hooks/useGeneration';
import { useBulkActions } from '@/lib/hooks/useBulkActions';
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

  const { processBulkAccept, isProcessing } = useBulkActions(handleAccept);

  const onAcceptCandidate = (candidateId: string) => {
    handleAccept(candidateId)
      .then(() => toast.success('Flashcard saved successfully!'))
      .catch(() => toast.error('Failed to save flashcard'));
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

  const onGenerateSubmit = (sourceText: string) => {
    // Update the source text in the hook and then generate
    handleSourceTextChange(sourceText);
    handleGenerate();
  };

  return (
    <div className="space-y-8">
      <SourceTextInput
        onSubmit={onGenerateSubmit}
        isLoading={status === 'loading'}
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
        onBulkAccept={processBulkAccept}
        onEdit={onEditCandidate}
        onReject={onRejectCandidate}
        isProcessing={isProcessing}
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