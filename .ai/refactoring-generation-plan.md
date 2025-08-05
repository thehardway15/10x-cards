# Plan Wdrożenia Refaktoryzacji Komponentów @generate/ z React Hook Form

## 1. Przygotowanie środowiska

### 1.1 Instalacja zależności
```bash
npm install react-hook-form @hookform/resolvers zod
npm install -D @types/react-hook-form
```

### 1.2 Konfiguracja TypeScript
Dodaj do `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true
  }
}
```

## 2. Implementacja Custom Hooks

### 2.1 Hook useBulkActions
**Plik:** `src/lib/hooks/useBulkActions.ts`

```typescript
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
```

### 2.2 Hook useFlashcardValidation
**Plik:** `src/lib/hooks/useFlashcardValidation.ts`

```typescript
import { z } from 'zod';

export const flashcardSchema = z.object({
  front: z.string()
    .min(1, 'Front side cannot be empty')
    .max(200, 'Front side cannot exceed 200 characters'),
  back: z.string()
    .min(1, 'Back side cannot be empty')
    .max(500, 'Back side cannot exceed 500 characters')
});

export const sourceTextSchema = z.object({
  sourceText: z.string()
    .min(1000, 'Text must be at least 1,000 characters')
    .max(10000, 'Text must not exceed 10,000 characters')
});

export type FlashcardFormData = z.infer<typeof flashcardSchema>;
export type SourceTextFormData = z.infer<typeof sourceTextSchema>;
```

## 3. Refaktoryzacja komponentów

### 3.1 EditFlashcardModal.tsx
**Plik:** `src/components/generate/EditFlashcardModal.tsx`

```typescript
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { flashcardSchema, type FlashcardFormData } from '@/lib/hooks/useFlashcardValidation';
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
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch
  } = useForm<FlashcardFormData>({
    resolver: zodResolver(flashcardSchema),
    defaultValues: { front: '', back: '' }
  });

  const frontValue = watch('front');
  const backValue = watch('back');

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
      source: 'ai-edited',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-w-full overflow-auto">
        <DialogHeader>
          <DialogTitle>Edit Flashcard</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="front">
              Front Side <span className="text-muted-foreground text-sm">({frontValue.length}/200)</span>
            </Label>
            <Textarea
              {...register('front')}
              placeholder="Enter the front side text"
              className={errors.front ? 'border-destructive break-words' : 'break-words'}
            />
            {errors.front && (
              <p className="text-sm text-destructive">{errors.front.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="back">
              Back Side <span className="text-muted-foreground text-sm">({backValue.length}/500)</span>
            </Label>
            <Textarea
              {...register('back')}
              placeholder="Enter the back side text"
              className={errors.back ? 'border-destructive break-words' : 'break-words'}
            />
            {errors.back && (
              <p className="text-sm text-destructive">{errors.back.message}</p>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid}>
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### 3.2 SourceTextInput.tsx
**Plik:** `src/components/generate/SourceTextInput.tsx`

```typescript
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { sourceTextSchema, type SourceTextFormData } from '@/lib/hooks/useFlashcardValidation';

interface SourceTextInputProps {
  sourceText: string;
  onSourceTextChange: (text: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function SourceTextInput({
  sourceText,
  onSourceTextChange,
  onSubmit,
  isLoading,
}: SourceTextInputProps) {
  const {
    register,
    watch,
    formState: { errors, isValid }
  } = useForm<SourceTextFormData>({
    resolver: zodResolver(sourceTextSchema),
    defaultValues: { sourceText }
  });

  const watchedSourceText = watch('sourceText');
  const charCount = watchedSourceText.length;

  useEffect(() => {
    onSourceTextChange(watchedSourceText);
  }, [watchedSourceText, onSourceTextChange]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Textarea
          {...register('sourceText')}
          placeholder="Paste your text here (1,000-10,000 characters)"
          className="min-h-[200px] resize-y"
          disabled={isLoading}
          data-testid="source-text-input"
        />
        <div className="absolute bottom-2 right-2 text-sm text-muted-foreground">
          {charCount.toLocaleString()} / 10,000
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {errors.sourceText?.message || '\u00A0'}
        </p>
        <Button
          onClick={onSubmit}
          disabled={!isValid || isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Generate Flashcards
        </Button>
      </div>
    </div>
  );
}
```

### 3.3 GenerationActions.tsx (nowy komponent)
**Plik:** `src/components/generate/GenerationActions.tsx`

```typescript
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import type { GenerationCandidateViewModel } from '@/lib/hooks/useGeneration';

interface GenerationActionsProps {
  candidates: GenerationCandidateViewModel[];
  onBulkAccept: (candidateIds: string[]) => void;
  isProcessing?: boolean;
}

export function GenerationActions({ 
  candidates, 
  onBulkAccept, 
  isProcessing = false 
}: GenerationActionsProps) {
  const availableCandidates = candidates.filter(c => c.status === 'idle');
  const hasAvailableCandidates = availableCandidates.length > 0;
  
  return (
    <div className="flex justify-end">
      <Button
        onClick={() => onBulkAccept(availableCandidates.map(c => c.candidateId))}
        disabled={!hasAvailableCandidates || isProcessing}
        className="gap-2"
      >
        <Check className="h-4 w-4" />
        Accept All ({availableCandidates.length})
      </Button>
    </div>
  );
}
```

### 3.4 CandidateList.tsx
**Plik:** `src/components/generate/CandidateList.tsx`

```typescript
import { CandidateListItem } from './CandidateListItem';
import { GenerationActions } from './GenerationActions';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/pagination';
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
  isProcessing?: boolean;
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
  isProcessing = false,
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

  return (
    <div className="space-y-6">
      <GenerationActions
        candidates={candidates}
        onBulkAccept={onBulkAccept}
        isProcessing={isProcessing}
      />
      
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
```

### 3.5 GenerateView.tsx
**Plik:** `src/components/generate/GenerateView.tsx`

```typescript
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

  return (
    <div className="space-y-8">
      <SourceTextInput
        sourceText={sourceText}
        onSourceTextChange={handleSourceTextChange}
        onSubmit={handleGenerate}
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
```

## 4. Aktualizacja testów

### 4.1 Testy dla React Hook Form
**Plik:** `src/components/generate/__tests__/EditFlashcardModal.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../../test/utils/test-utils';
import { renderHook } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EditFlashcardModal } from '../EditFlashcardModal';
import { flashcardSchema } from '@/lib/hooks/useFlashcardValidation';
import type { GenerationCandidateViewModel } from '@/lib/hooks/useGeneration';

describe('EditFlashcardModal with React Hook Form', () => {
  const mockCandidate: GenerationCandidateViewModel = {
    candidateId: 'test-id-1',
    front: 'Original Front Text',
    back: 'Original Back Text',
    source: 'ai-full',
    status: 'idle'
  };

  const defaultProps = {
    isOpen: true,
    onOpenChange: vi.fn(),
    candidate: mockCandidate,
    onSave: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates form fields using React Hook Form', async () => {
    const { result } = renderHook(() => 
      useForm({
        resolver: zodResolver(flashcardSchema),
        defaultValues: { front: '', back: '' }
      })
    );

    const { trigger } = result.current;
    
    // Test empty validation
    const isValid = await trigger();
    expect(isValid).toBe(false);
    
    // Test length validation
    result.current.setValue('front', 'a'.repeat(201));
    const isFrontValid = await trigger('front');
    expect(isFrontValid).toBe(false);
  });

  it('submits form with valid data', async () => {
    const onSave = vi.fn();
    const { user } = render(
      <EditFlashcardModal {...defaultProps} onSave={onSave} />
    );

    const frontTextarea = screen.getByLabelText(/Front Side/i);
    const backTextarea = screen.getByLabelText(/Back Side/i);

    await user.clear(frontTextarea);
    await user.type(frontTextarea, 'Valid Front');
    await user.clear(backTextarea);
    await user.type(backTextarea, 'Valid Back');

    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    await user.click(saveButton);

    expect(onSave).toHaveBeenCalledWith({
      ...mockCandidate,
      front: 'Valid Front',
      back: 'Valid Back',
      source: 'ai-edited'
    });
  });

  it('disables save button when form is invalid', () => {
    render(<EditFlashcardModal {...defaultProps} />);
    
    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    expect(saveButton).toBeDisabled();
  });
});
```

### 4.2 Testy dla custom hooks
**Plik:** `src/lib/hooks/__tests__/useBulkActions.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBulkActions } from '../useBulkActions';

describe('useBulkActions', () => {
  it('processes bulk accept actions correctly', async () => {
    const mockHandleAccept = vi.fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Failed'));
    
    const { result } = renderHook(() => useBulkActions(mockHandleAccept));
    
    await act(async () => {
      await result.current.processBulkAccept(['id1', 'id2']);
    });
    
    expect(mockHandleAccept).toHaveBeenCalledTimes(2);
    expect(mockHandleAccept).toHaveBeenCalledWith('id1');
    expect(mockHandleAccept).toHaveBeenCalledWith('id2');
  });

  it('handles empty candidate list', async () => {
    const mockHandleAccept = vi.fn();
    const { result } = renderHook(() => useBulkActions(mockHandleAccept));
    
    await act(async () => {
      await result.current.processBulkAccept([]);
    });
    
    expect(mockHandleAccept).not.toHaveBeenCalled();
  });
});
```

## 5. Plan wdrożenia krok po kroku

### Faza 1: Przygotowanie (1-2 dni)
1. Instalacja zależności React Hook Form
2. Konfiguracja TypeScript
3. Utworzenie schematów walidacji

### Faza 2: Implementacja hooks (1 dzień)
1. Implementacja `useBulkActions`
2. Implementacja `useFlashcardValidation`
3. Testy jednostkowe dla hooks

### Faza 3: Refaktoryzacja komponentów (2-3 dni)
1. Refaktoryzacja `EditFlashcardModal.tsx`
2. Refaktoryzacja `SourceTextInput.tsx`
3. Utworzenie `GenerationActions.tsx`
4. Aktualizacja `CandidateList.tsx`
5. Uproszczenie `GenerateView.tsx`

### Faza 4: Testy i walidacja (1-2 dni)
1. Aktualizacja testów jednostkowych
2. Testy integracyjne
3. Testy edge cases
4. Code review

### Faza 5: Wdrożenie (1 dzień)
1. Merge do głównej gałęzi
2. Testy w środowisku staging
3. Wdrożenie produkcyjne

## 6. Metryki sukcesu

### 6.1 Metryki kodu
- **Redukcja LOC**: Oczekiwana redukcja o 20-30%
- **Cyklomatyczna złożoność**: Zmniejszenie o 15-25%
- **Duplikacja kodu**: Eliminacja duplikacji walidacji

### 6.2 Metryki wydajności
- **Re-rendery**: Zmniejszenie o 40-50% dzięki React Hook Form
- **Bundle size**: Minimalny wzrost (< 10KB)
- **Time to Interactive**: Brak wpływu

### 6.3 Metryki jakości
- **Test coverage**: Utrzymanie > 90%
- **TypeScript coverage**: 100%
- **Linting errors**: 0
