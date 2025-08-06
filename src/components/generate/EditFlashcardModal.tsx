import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { flashcardSchema, type FlashcardFormData } from "@/lib/hooks/useFlashcardValidation";
import type { GenerationCandidateViewModel } from "@/lib/hooks/useGeneration";

interface EditFlashcardModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  candidate: GenerationCandidateViewModel | null;
  onSave: (updatedCandidate: GenerationCandidateViewModel) => void;
}

export function EditFlashcardModal({ isOpen, onOpenChange, candidate, onSave }: EditFlashcardModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<FlashcardFormData>({
    resolver: zodResolver(flashcardSchema),
    defaultValues: { front: "", back: "" },
  });

  const frontValue = watch("front");
  const backValue = watch("back");

  useEffect(() => {
    if (candidate) {
      reset({ front: candidate.front, back: candidate.back });
    }
  }, [candidate, reset]);

  const onSubmit = (data: FlashcardFormData) => {
    if (!candidate) return;

    onSave({
      ...candidate,
      ...data,
      source: "ai-edited",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-w-full max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Flashcard</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="front">
                Front Side <span className="text-muted-foreground text-sm">({frontValue.length}/200)</span>
              </Label>
              <Textarea
                id="front"
                {...register("front")}
                placeholder="Enter the front side text"
                className={`${errors.front ? "border-destructive" : ""} break-words resize-none`}
                rows={4}
              />
              {errors.front && <p className="text-sm text-destructive">{errors.front.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="back">
                Back Side <span className="text-muted-foreground text-sm">({backValue.length}/500)</span>
              </Label>
              <Textarea
                id="back"
                {...register("back")}
                placeholder="Enter the back side text"
                className={`${errors.back ? "border-destructive" : ""} break-words resize-none`}
                rows={6}
              />
              {errors.back && <p className="text-sm text-destructive">{errors.back.message}</p>}
            </div>
          </div>

          <DialogFooter className="flex-shrink-0 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
