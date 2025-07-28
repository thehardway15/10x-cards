import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../test/utils/test-utils';
import { CandidateList } from '../CandidateList';
import type { GenerationCandidateViewModel } from '@/lib/hooks/useGeneration';

// Mock the CandidateListItem component to simplify testing
vi.mock('../CandidateListItem', () => ({
  CandidateListItem: ({ candidate, onAccept, onEdit, onReject }: any) => (
    <div data-testid={`candidate-item-${candidate.candidateId}`}>
      <span>{candidate.front}</span>
      <span>{candidate.back}</span>
      <button onClick={() => onAccept(candidate.candidateId)}>Accept</button>
      <button onClick={() => onEdit(candidate.candidateId)}>Edit</button>
      <button onClick={() => onReject(candidate.candidateId)}>Reject</button>
    </div>
  )
}));

// Mock the Pagination component
vi.mock('@/components/ui/pagination', () => ({
  Pagination: ({ currentPage, totalPages, onPageChange }: any) => (
    <div data-testid="pagination">
      <span>Page {currentPage} of {totalPages}</span>
      <button onClick={() => onPageChange(currentPage + 1)}>Next</button>
    </div>
  )
}));

describe('CandidateList Component', () => {
  const mockCandidates: GenerationCandidateViewModel[] = [
    {
      candidateId: 'id-1',
      front: 'Question 1',
      back: 'Answer 1',
      source: 'ai-full',
      status: 'idle'
    },
    {
      candidateId: 'id-2',
      front: 'Question 2',
      back: 'Answer 2',
      source: 'ai-full',
      status: 'idle'
    },
    {
      candidateId: 'id-3',
      front: 'Question 3',
      back: 'Answer 3',
      source: 'ai-edited',
      status: 'saving'
    }
  ];

  const defaultProps = {
    candidates: mockCandidates,
    isLoading: false,
    currentPage: 1,
    pageSize: 10,
    totalItems: 3,
    onPageChange: vi.fn(),
    onAccept: vi.fn(),
    onBulkAccept: vi.fn(),
    onEdit: vi.fn(),
    onReject: vi.fn()
  };

  it('renders loading skeletons when isLoading is true', () => {
    render(<CandidateList {...defaultProps} isLoading={true} />);
    
    // Check for skeletons (3 by default)
    const skeletons = document.querySelectorAll('.h-\\[200px\\]');
    expect(skeletons.length).toBe(3);
  });

  it('renders empty state message when there are no candidates', () => {
    render(<CandidateList {...defaultProps} candidates={[]} />);
    
    expect(screen.getByText(/No flashcard candidates available/i)).toBeInTheDocument();
  });

  it('renders all candidates when provided', () => {
    render(<CandidateList {...defaultProps} />);
    
    // Check each candidate is rendered
    expect(screen.getByTestId('candidate-item-id-1')).toBeInTheDocument();
    expect(screen.getByTestId('candidate-item-id-2')).toBeInTheDocument();
    expect(screen.getByTestId('candidate-item-id-3')).toBeInTheDocument();
  });

  it('renders pagination when totalItems > pageSize', () => {
    render(<CandidateList {...defaultProps} totalItems={15} pageSize={10} />);
    
    // Check if pagination is rendered using the testid
    expect(screen.getByTestId('pagination')).toBeInTheDocument();
  });

  it('does not render pagination when totalItems <= pageSize', () => {
    render(<CandidateList {...defaultProps} totalItems={10} pageSize={10} />);
    
    // Check that pagination is not rendered
    expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
  });

  it('shows "Accept All" button with correct count', () => {
    render(<CandidateList {...defaultProps} />);
    
    const acceptAllButton = screen.getByRole('button', { name: /accept all \(2\)/i });
    expect(acceptAllButton).toBeInTheDocument();
  });

  it('disables "Accept All" button when no idle candidates', () => {
    const busyCandidates = mockCandidates.map(c => ({ ...c, status: 'saving' as const }));
    render(<CandidateList {...defaultProps} candidates={busyCandidates} />);
    
    const acceptAllButton = screen.getByRole('button', { name: /accept all/i });
    expect(acceptAllButton).toBeDisabled();
  });

  it('calls onBulkAccept with correct candidate IDs when "Accept All" is clicked', async () => {
    const onBulkAccept = vi.fn();
    const { user } = render(
      <CandidateList {...defaultProps} onBulkAccept={onBulkAccept} />
    );
    
    await user.click(screen.getByRole('button', { name: /accept all/i }));
    
    // Should only include idle candidates
    expect(onBulkAccept).toHaveBeenCalledWith(['id-1', 'id-2']);
  });

  it('passes correct props to CandidateListItem', () => {
    const onAccept = vi.fn();
    const onEdit = vi.fn();
    const onReject = vi.fn();
    
    render(
      <CandidateList 
        {...defaultProps} 
        onAccept={onAccept} 
        onEdit={onEdit} 
        onReject={onReject} 
      />
    );

    // Test interaction with first candidate item
    const buttons = screen.getAllByRole('button', { name: 'Accept' });
    buttons[0].click();
    
    expect(onAccept).toHaveBeenCalledWith('id-1');
  });
}); 