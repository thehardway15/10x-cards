import { useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { sourceTextSchema, type SourceTextFormData } from '@/lib/hooks/useFlashcardValidation';

interface SourceTextInputProps {
  onSubmit: (sourceText: string) => void;
  isLoading: boolean;
}

export function SourceTextInput({
  onSubmit,
  isLoading,
}: SourceTextInputProps) {
  // Use a stable form configuration
  const formConfig = useMemo(() => ({
    resolver: zodResolver(sourceTextSchema),
    defaultValues: { sourceText: '' },
    mode: 'onChange' as const
  }), []);

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<SourceTextFormData>(formConfig);

  const watchedSourceText = watch('sourceText');
  const charCount = watchedSourceText.length;



  const handleFormSubmit = (data: SourceTextFormData) => {
    onSubmit(data.sourceText);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
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
          type="submit"
          disabled={!isValid || isLoading}
          data-testid="generate-button"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Generate Flashcards
        </Button>
      </div>
    </form>
  );
} 