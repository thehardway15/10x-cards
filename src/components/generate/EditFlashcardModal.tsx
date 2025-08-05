import { useState, useEffect, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { GenerationCandidateViewModel } from '@/lib/hooks/useGeneration';

interface EditFlashcardModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  candidate: GenerationCandidateViewModel | null;
  onSave: (updatedCandidate: GenerationCandidateViewModel) => void;
}

export function EditFlashcardModal({
  isOpen,
  onOpenChange,
  candidate,
  onSave,
}: EditFlashcardModalProps) {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [frontError, setFrontError] = useState('');
  const [backError, setBackError] = useState('');

  useEffect(() => {
    if (candidate) {
      setFront(candidate.front);
      setBack(candidate.back);
      setFrontError('');
      setBackError('');
    }
  }, [candidate]);

  const validateFields = () => {
    let isValid = true;
    
    if (front.length === 0) {
      setFrontError('Front side cannot be empty');
      isValid = false;
    } else if (front.length > 200) {
      setFrontError('Front side cannot exceed 200 characters');
      isValid = false;
    } else {
      setFrontError('');
    }

    if (back.length === 0) {
      setBackError('Back side cannot be empty');
      isValid = false;
    } else if (back.length > 500) {
      setBackError('Back side cannot exceed 500 characters');
      isValid = false;
    } else {
      setBackError('');
    }

    return isValid;
  };

  const handleSave = () => {
    if (!candidate || !validateFields()) return;

    onSave({
      ...candidate,
      front,
      back,
      source: 'ai-edited',
    });
    onOpenChange(false);
  };

  const handleFrontChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setFront(e.target.value);
  };

  const handleBackChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setBack(e.target.value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-w-full overflow-auto">
        <DialogHeader>
          <DialogTitle>Edit Flashcard</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="front">
              Front Side <span className="text-muted-foreground text-sm">({front.length}/200)</span>
            </Label>
            <Textarea
              id="front"
              value={front}
              onChange={handleFrontChange}
              placeholder="Enter the front side text"
              className={frontError ? 'border-destructive break-words' : 'break-words'}
            />
            {frontError && (
              <p className="text-sm text-destructive">{frontError}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="back">
              Back Side <span className="text-muted-foreground text-sm">({back.length}/500)</span>
            </Label>
            <Textarea
              id="back"
              value={back}
              onChange={handleBackChange}
              placeholder="Enter the back side text"
              className={backError ? 'border-destructive break-words' : 'break-words'}
            />
            {backError && (
              <p className="text-sm text-destructive">{backError}</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 