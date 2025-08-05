import { useState } from 'react';
import { toast } from 'sonner';

export const useBulkActions = (handleAccept: (id: string) => Promise<void>) => {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const processBulkAccept = async (candidateIds: string[]) => {
    if (candidateIds.length === 0) return;
    
    setIsProcessing(true);
    const loadingToast = toast.loading(`Accepting ${candidateIds.length} flashcards...`);
    
    const results = await Promise.allSettled(
      candidateIds.map(id => handleAccept(id))
    );
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failureCount = results.filter(r => r.status === 'rejected').length;
    
    toast.dismiss(loadingToast);
    
    if (successCount > 0) {
      toast.success(`Successfully saved ${successCount} flashcard${successCount !== 1 ? 's' : ''}`);
    }
    if (failureCount > 0) {
      toast.error(`Failed to save ${failureCount} flashcard${failureCount !== 1 ? 's' : ''}`);
    }
    
    setIsProcessing(false);
  };
  
  return { processBulkAccept, isProcessing };
}; 