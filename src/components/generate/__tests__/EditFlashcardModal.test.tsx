import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../../test/utils/test-utils';
import { EditFlashcardModal } from '../EditFlashcardModal';
import type { GenerationCandidateViewModel } from '@/lib/hooks/useGeneration';

describe('EditFlashcardModal Component', () => {
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

  // Reset mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the modal when isOpen is true', () => {
    render(<EditFlashcardModal {...defaultProps} />);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Edit Flashcard')).toBeInTheDocument();
  });

  it('does not render the modal when isOpen is false', () => {
    render(<EditFlashcardModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('initializes form fields with candidate values', () => {
    render(<EditFlashcardModal {...defaultProps} />);
    
    // Get textareas by their labels
    const frontTextarea = screen.getByLabelText(/Front Side/i);
    const backTextarea = screen.getByLabelText(/Back Side/i);
    
    expect(frontTextarea).toHaveValue('Original Front Text');
    expect(backTextarea).toHaveValue('Original Back Text');
  });

  it('shows character count for front and back sides', () => {
    render(<EditFlashcardModal {...defaultProps} />);
    
    // Use regex pattern matching to find the character count displays
    expect(screen.getByText(/\(\d+\/200\)/)).toBeInTheDocument(); // Front side length
    expect(screen.getByText(/\(\d+\/500\)/)).toBeInTheDocument(); // Back side length
  });

  it('updates form values when edited', async () => {
    const { user } = render(<EditFlashcardModal {...defaultProps} />);
    
    const frontTextarea = screen.getByLabelText(/Front Side/i);
    
    // Clear and type new text
    await user.clear(frontTextarea);
    await user.type(frontTextarea, 'New Front Text');
    
    expect(frontTextarea).toHaveValue('New Front Text');
  });

  it('validates empty front side and shows error on submit', async () => {
    const { user } = render(<EditFlashcardModal {...defaultProps} />);
    
    const frontTextarea = screen.getByLabelText(/Front Side/i);
    await user.clear(frontTextarea);
    
    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    await user.click(saveButton);
    
    expect(screen.getByText('Front side cannot be empty')).toBeInTheDocument();
  });

  it('validates empty back side and shows error on submit', async () => {
    const { user } = render(<EditFlashcardModal {...defaultProps} />);
    
    const backTextarea = screen.getByLabelText(/Back Side/i);
    await user.clear(backTextarea);
    
    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    await user.click(saveButton);
    
    expect(screen.getByText('Back side cannot be empty')).toBeInTheDocument();
  });

  it('validates front side length and shows error when too long on submit', async () => {
    const { user } = render(<EditFlashcardModal {...defaultProps} />);
    
    const frontTextarea = screen.getByLabelText(/Front Side/i);
    await user.clear(frontTextarea);
    await user.type(frontTextarea, 'a'.repeat(201)); // Exceed 200 character limit
    
    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    await user.click(saveButton);
    
    expect(screen.getByText('Front side cannot exceed 200 characters')).toBeInTheDocument();
  });

  it('validates back side length and shows error when too long on submit', async () => {
    const { user } = render(<EditFlashcardModal {...defaultProps} />);
    
    const backTextarea = screen.getByLabelText(/Back Side/i);
    await user.clear(backTextarea);
    await user.type(backTextarea, 'a'.repeat(501)); // Exceed 500 character limit
    
    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    await user.click(saveButton);
    
    expect(screen.getByText('Back side cannot exceed 500 characters')).toBeInTheDocument();
  });

  it('calls onSave with updated values when form is valid', async () => {
    const onSave = vi.fn();
    const { user } = render(
      <EditFlashcardModal {...defaultProps} onSave={onSave} />
    );
    
    const frontTextarea = screen.getByLabelText(/Front Side/i);
    const backTextarea = screen.getByLabelText(/Back Side/i);
    
    // Edit front side
    await user.clear(frontTextarea);
    await user.type(frontTextarea, 'Updated Front');
    
    // Edit back side
    await user.clear(backTextarea);
    await user.type(backTextarea, 'Updated Back');
    
    // Save changes
    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    await user.click(saveButton);
    
    // Check if onSave was called with correct values
    expect(onSave).toHaveBeenCalledWith({
      ...mockCandidate,
      front: 'Updated Front',
      back: 'Updated Back',
      source: 'ai-edited'
    });
  });

  it('calls onOpenChange when Cancel button is clicked', async () => {
    const onOpenChange = vi.fn();
    const { user } = render(
      <EditFlashcardModal {...defaultProps} onOpenChange={onOpenChange} />
    );
    
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    await user.click(cancelButton);
    
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
}); 