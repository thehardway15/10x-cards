import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2, Check, X, Pencil } from 'lucide-react';
import type { GenerationCandidateViewModel } from '@/lib/hooks/useGeneration';

interface CandidateListItemProps {
  candidate: GenerationCandidateViewModel;
  onAccept: (candidateId: string) => void;
  onEdit: (candidateId: string) => void;
  onReject: (candidateId: string) => void;
}

export function CandidateListItem({
  candidate,
  onAccept,
  onEdit,
  onReject,
}: CandidateListItemProps) {
  const isSaving = candidate.status === 'saving';
  const isDeleting = candidate.status === 'deleting';
  const isProcessing = isSaving || isDeleting;

  return (
    <Card className="relative h-full" data-testid={`candidate-item-${candidate.candidateId}`}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Front</h3>
            <p className="text-base">{candidate.front}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Back</h3>
            <p className="text-base">{candidate.back}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onReject(candidate.candidateId)}
          disabled={isProcessing}
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <X className="h-4 w-4" />
          )}
          <span className="ml-2">Reject</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(candidate.candidateId)}
          disabled={isProcessing}
        >
          <Pencil className="h-4 w-4" />
          <span className="ml-2">Edit</span>
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={() => onAccept(candidate.candidateId)}
          disabled={isProcessing}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          <span className="ml-2">Accept</span>
        </Button>
      </CardFooter>
      {candidate.source === 'ai-edited' && (
        <div className="absolute top-2 right-2">
          <span className="text-xs bg-muted px-2 py-1 rounded-full">
            Edited
          </span>
        </div>
      )}
    </Card>
  );
} 