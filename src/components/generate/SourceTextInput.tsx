import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface SourceTextInputProps {
  sourceText: string;
  onSourceTextChange: (text: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  charCount: number;
  isValid: boolean;
}

export function SourceTextInput({
  sourceText,
  onSourceTextChange,
  onSubmit,
  isLoading,
  charCount,
  isValid,
}: SourceTextInputProps) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Textarea
          value={sourceText}
          onChange={(e) => onSourceTextChange(e.target.value)}
          placeholder="Paste your text here (1,000-10,000 characters)"
          className="min-h-[200px] resize-y"
          disabled={isLoading}
        />
        <div className="absolute bottom-2 right-2 text-sm text-muted-foreground">
          {charCount.toLocaleString()} / 10,000
        </div>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {charCount < 1000
            ? 'Text must be at least 1,000 characters'
            : charCount > 10000
            ? 'Text must not exceed 10,000 characters'
            : '\u00A0' /* Non-breaking space to maintain height */}
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