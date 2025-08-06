import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import type { GenerationCandidateViewModel } from "@/lib/hooks/useGeneration";

interface GenerationActionsProps {
  candidates: GenerationCandidateViewModel[];
  onBulkAccept: (candidateIds: string[]) => void;
  isProcessing?: boolean;
}

export function GenerationActions({ candidates, onBulkAccept, isProcessing = false }: GenerationActionsProps) {
  const availableCandidates = candidates.filter((c) => c.status === "idle");
  const hasAvailableCandidates = availableCandidates.length > 0;

  return (
    <div className="flex justify-end">
      <Button
        onClick={() => onBulkAccept(availableCandidates.map((c) => c.candidateId))}
        disabled={!hasAvailableCandidates || isProcessing}
        className="gap-2"
      >
        <Check className="h-4 w-4" />
        Accept All ({availableCandidates.length})
      </Button>
    </div>
  );
}
