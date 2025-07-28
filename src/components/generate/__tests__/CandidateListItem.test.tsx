import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../test/utils/test-utils';
import { CandidateListItem } from '../CandidateListItem';
import type { GenerationCandidateViewModel } from '@/lib/hooks/useGeneration';

describe('CandidateListItem Component', () => {
  const mockCandidate: GenerationCandidateViewModel = {
    candidateId: 'test-id-1',
    front: 'Test Question',
    back: 'Test Answer',
    source: 'ai-full',
    status: 'idle'
  };

  const defaultProps = {
    candidate: mockCandidate,
    onAccept: vi.fn(),
    onEdit: vi.fn(),
    onReject: vi.fn()
  };

  it('renders card with front and back content', () => {
    render(<CandidateListItem {...defaultProps} />);
    
    expect(screen.getByText('Front')).toBeInTheDocument();
    expect(screen.getByText('Back')).toBeInTheDocument();
    expect(screen.getByText('Test Question')).toBeInTheDocument();
    expect(screen.getByText('Test Answer')).toBeInTheDocument();
  });

  it('renders action buttons', () => {
    render(<CandidateListItem {...defaultProps} />);
    
    expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument();
  });

  it('calls onAccept when accept button is clicked', async () => {
    const onAccept = vi.fn();
    const { user } = render(
      <CandidateListItem {...defaultProps} onAccept={onAccept} />
    );
    
    await user.click(screen.getByRole('button', { name: /accept/i }));
    expect(onAccept).toHaveBeenCalledWith('test-id-1');
  });

  it('calls onEdit when edit button is clicked', async () => {
    const onEdit = vi.fn();
    const { user } = render(
      <CandidateListItem {...defaultProps} onEdit={onEdit} />
    );
    
    await user.click(screen.getByRole('button', { name: /edit/i }));
    expect(onEdit).toHaveBeenCalledWith('test-id-1');
  });

  it('calls onReject when reject button is clicked', async () => {
    const onReject = vi.fn();
    const { user } = render(
      <CandidateListItem {...defaultProps} onReject={onReject} />
    );
    
    await user.click(screen.getByRole('button', { name: /reject/i }));
    expect(onReject).toHaveBeenCalledWith('test-id-1');
  });

  it('shows loading spinner when candidate status is saving', () => {
    const savingCandidate = { 
      ...mockCandidate, 
      status: 'saving' as const 
    };
    
    render(<CandidateListItem {...defaultProps} candidate={savingCandidate} />);
    
    // Check for loading spinner in accept button
    const loadingSpinner = document.querySelector('.animate-spin');
    expect(loadingSpinner).toBeInTheDocument();
    
    // Check that buttons are disabled
    expect(screen.getByRole('button', { name: /reject/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /edit/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /accept/i })).toBeDisabled();
  });

  it('shows loading spinner when candidate status is deleting', () => {
    const deletingCandidate = { 
      ...mockCandidate, 
      status: 'deleting' as const 
    };
    
    render(<CandidateListItem {...defaultProps} candidate={deletingCandidate} />);
    
    // Check for loading spinner in reject button
    const loadingSpinner = document.querySelector('.animate-spin');
    expect(loadingSpinner).toBeInTheDocument();
    
    // Check that buttons are disabled
    expect(screen.getByRole('button', { name: /reject/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /edit/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /accept/i })).toBeDisabled();
  });
  
  it('displays "Edited" badge when source is ai-edited', () => {
    const editedCandidate = { 
      ...mockCandidate, 
      source: 'ai-edited' as const 
    };
    
    render(<CandidateListItem {...defaultProps} candidate={editedCandidate} />);
    
    expect(screen.getByText('Edited')).toBeInTheDocument();
  });
  
  it('does not display "Edited" badge when source is not ai-edited', () => {
    render(<CandidateListItem {...defaultProps} />);
    
    expect(screen.queryByText('Edited')).not.toBeInTheDocument();
  });
}); 