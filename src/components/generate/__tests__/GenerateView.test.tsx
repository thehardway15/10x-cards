import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../../test/utils/test-utils';
import { GenerateView } from '../GenerateView';
import * as useGenerationModule from '@/lib/hooks/useGeneration';
import type { GenerationCandidateViewModel } from '@/lib/hooks/useGeneration';

// Mock the useGeneration hook
vi.mock('@/lib/hooks/useGeneration', async () => {
  const actual = await vi.importActual('@/lib/hooks/useGeneration');
  return {
    ...actual,
    useGeneration: vi.fn()
  };
});

// Mock the toast component
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  }
}));

// Mock child components to simplify testing
vi.mock('../SourceTextInput', () => ({
  SourceTextInput: ({ 
    sourceText, 
    onSourceTextChange, 
    onSubmit, 
    isLoading, 
    isValid 
  }: any) => (
    <div data-testid="source-text-input">
      <input 
        data-testid="source-text" 
        value={sourceText} 
        onChange={(e) => onSourceTextChange(e.target.value)} 
      />
      <button 
        data-testid="generate-button" 
        onClick={onSubmit}
        disabled={isLoading || !isValid}
      >
        Generate
      </button>
    </div>
  )
}));

vi.mock('../CandidateList', () => ({
  CandidateList: ({ 
    candidates, 
    isLoading, 
    onAccept, 
    onBulkAccept, 
    onEdit, 
    onReject 
  }: any) => (
    <div data-testid="candidate-list">
      {candidates.map((c: any) => (
        <div key={c.candidateId} data-testid={`candidate-${c.candidateId}`}>
          <button 
            data-testid={`accept-${c.candidateId}`} 
            onClick={() => onAccept(c.candidateId)}
          >
            Accept
          </button>
          <button 
            data-testid={`edit-${c.candidateId}`} 
            onClick={() => onEdit(c.candidateId)}
          >
            Edit
          </button>
          <button 
            data-testid={`reject-${c.candidateId}`} 
            onClick={() => onReject(c.candidateId)}
          >
            Reject
          </button>
        </div>
      ))}
      <button 
        data-testid="bulk-accept" 
        onClick={() => onBulkAccept(['id1', 'id2'])}
      >
        Accept All
      </button>
    </div>
  )
}));

vi.mock('../EditFlashcardModal', () => ({
  EditFlashcardModal: ({ 
    isOpen, 
    onOpenChange, 
    candidate, 
    onSave 
  }: any) => (
    isOpen && (
      <div data-testid="edit-modal">
        <button 
          data-testid="save-edit" 
          onClick={() => onSave({ ...candidate, front: 'Updated Front', back: 'Updated Back' })}
        >
          Save
        </button>
        <button 
          data-testid="close-edit-modal" 
          onClick={() => onOpenChange(false)}
        >
          Close
        </button>
      </div>
    )
  )
}));

vi.mock('../ConfirmActionDialog', () => ({
  ConfirmActionDialog: ({ 
    isOpen, 
    onOpenChange, 
    onConfirm 
  }: any) => (
    isOpen && (
      <div data-testid="confirm-dialog">
        <button 
          data-testid="confirm-reject" 
          onClick={onConfirm}
        >
          Confirm Reject
        </button>
        <button 
          data-testid="cancel-reject" 
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </button>
      </div>
    )
  )
}));

describe('GenerateView Component', () => {
  // Mock data for useGeneration hook
  const mockCandidates: GenerationCandidateViewModel[] = [
    {
      candidateId: 'id1',
      front: 'Question 1',
      back: 'Answer 1',
      source: 'ai-full',
      status: 'idle'
    },
    {
      candidateId: 'id2',
      front: 'Question 2',
      back: 'Answer 2',
      source: 'ai-full',
      status: 'idle'
    }
  ];

  // Mock implementation of useGeneration hook with correct status type
  const mockUseGeneration = {
    sourceText: 'Test source text',
    status: 'idle' as const,
    error: null,
    candidates: mockCandidates,
    totalCandidates: 2,
    currentPage: 1,
    pageSize: 10,
    isValidSourceText: true,
    handleSourceTextChange: vi.fn(),
    handleGenerate: vi.fn(),
    handleAccept: vi.fn().mockResolvedValue(undefined),
    handleEdit: vi.fn(),
    handleReject: vi.fn(),
    setPage: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(useGenerationModule, 'useGeneration').mockReturnValue(mockUseGeneration);
  });

  it('renders the component with all necessary parts', () => {
    render(<GenerateView />);
    
    expect(screen.getByTestId('source-text-input')).toBeInTheDocument();
    expect(screen.getByTestId('candidate-list')).toBeInTheDocument();
  });

  it('displays error message when generation error occurs', () => {
    vi.spyOn(useGenerationModule, 'useGeneration').mockReturnValue({
      ...mockUseGeneration,
      error: 'An error occurred',
    });
    
    render(<GenerateView />);
    
    expect(screen.getByText('An error occurred')).toBeInTheDocument();
  });

  it('opens edit modal when edit button is clicked', async () => {
    const { user } = render(<GenerateView />);
    
    await user.click(screen.getByTestId('edit-id1'));
    
    expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
  });

  it('calls handleEdit with updated candidate when saving edit', async () => {
    const { user } = render(<GenerateView />);
    
    // Open edit modal
    await user.click(screen.getByTestId('edit-id1'));
    
    // Save changes
    await user.click(screen.getByTestId('save-edit'));
    
    // Check if handleEdit was called with updated candidate
    expect(mockUseGeneration.handleEdit).toHaveBeenCalledWith(expect.objectContaining({
      candidateId: 'id1',
      front: 'Updated Front',
      back: 'Updated Back'
    }));
  });

  it('opens confirm dialog when reject button is clicked', async () => {
    const { user } = render(<GenerateView />);
    
    await user.click(screen.getByTestId('reject-id1'));
    
    expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
  });

  it('calls handleReject when reject is confirmed', async () => {
    const { user } = render(<GenerateView />);
    
    // Open confirm dialog
    await user.click(screen.getByTestId('reject-id1'));
    
    // Confirm rejection
    await user.click(screen.getByTestId('confirm-reject'));
    
    // Check if handleReject was called with candidate ID
    expect(mockUseGeneration.handleReject).toHaveBeenCalledWith('id1');
  });

  it('calls handleAccept when accept button is clicked', async () => {
    const { user } = render(<GenerateView />);
    
    await user.click(screen.getByTestId('accept-id1'));
    
    expect(mockUseGeneration.handleAccept).toHaveBeenCalledWith('id1');
  });

  it('handles bulk accept of candidates', async () => {
    mockUseGeneration.handleAccept.mockResolvedValue(undefined);
    
    const { user } = render(<GenerateView />);
    
    await user.click(screen.getByTestId('bulk-accept'));
    
    // Check if handleAccept was called multiple times
    expect(mockUseGeneration.handleAccept).toHaveBeenCalledTimes(2);
  });

  it('shows success toast when flashcard is saved', async () => {
    const { toast } = await import('sonner');
    const { user } = render(<GenerateView />);
    
    await user.click(screen.getByTestId('accept-id1'));
    
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('saved successfully'));
  });

  it('shows error toast when flashcard save fails', async () => {
    const { toast } = await import('sonner');
    mockUseGeneration.handleAccept.mockRejectedValue(new Error('Failed'));
    
    const { user } = render(<GenerateView />);
    
    await user.click(screen.getByTestId('accept-id1'));
    
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Failed to save'));
  });

  it('handles loading and success states for bulk accept', async () => {
    const { toast } = await import('sonner');
    mockUseGeneration.handleAccept
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Failed'));
    
    const { user } = render(<GenerateView />);
    
    await user.click(screen.getByTestId('bulk-accept'));
    
    expect(toast.loading).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Successfully saved 1'));
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Failed to save 1'));
  });
}); 