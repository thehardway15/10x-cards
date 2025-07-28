import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../test/utils/test-utils';
import { SourceTextInput } from '../SourceTextInput';

describe('SourceTextInput Component', () => {
  const defaultProps = {
    sourceText: '',
    onSourceTextChange: vi.fn(),
    onSubmit: vi.fn(),
    isLoading: false,
    charCount: 0,
    isValid: false,
  };

  it('renders correctly with default props', () => {
    render(<SourceTextInput {...defaultProps} />);
    expect(screen.getByPlaceholderText(/paste your text here/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate flashcards/i })).toBeInTheDocument();
    expect(screen.getByText(/text must be at least 1,000 characters/i)).toBeInTheDocument();
  });

  it('displays character count correctly', () => {
    render(<SourceTextInput {...defaultProps} charCount={500} />);
    expect(screen.getByText('500 / 10,000')).toBeInTheDocument();
  });

  it('shows appropriate validation message based on character count', () => {
    // Text too short
    render(<SourceTextInput {...defaultProps} charCount={500} />);
    expect(screen.getByText(/text must be at least 1,000 characters/i)).toBeInTheDocument();
  });

  it('shows message when text is too long', () => {
    render(<SourceTextInput {...defaultProps} charCount={11000} />);
    expect(screen.getByText(/text must not exceed 10,000 characters/i)).toBeInTheDocument();
  });
  
  it('shows no validation message when text length is valid', () => {
    render(<SourceTextInput {...defaultProps} charCount={5000} />);
    expect(screen.queryByText(/text must be at least/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/text must not exceed/i)).not.toBeInTheDocument();
  });

  it('disables text area when loading', () => {
    render(<SourceTextInput {...defaultProps} isLoading={true} />);
    expect(screen.getByPlaceholderText(/paste your text here/i)).toBeDisabled();
  });

  it('disables generate button when text is invalid', () => {
    render(<SourceTextInput {...defaultProps} isValid={false} isLoading={false} />);
    expect(screen.getByRole('button', { name: /generate flashcards/i })).toBeDisabled();
  });
  
  it('disables generate button when loading', () => {
    render(<SourceTextInput {...defaultProps} isValid={true} isLoading={true} />);
    expect(screen.getByRole('button', { name: /generate flashcards/i })).toBeDisabled();
  });

  it('enables generate button when text is valid and not loading', () => {
    render(<SourceTextInput {...defaultProps} isValid={true} isLoading={false} />);
    expect(screen.getByRole('button', { name: /generate flashcards/i })).not.toBeDisabled();
  });

  it('shows loading indicator when isLoading is true', () => {
    render(<SourceTextInput {...defaultProps} isLoading={true} />);
    // Look for the Loader2 icon by finding the element with the animate-spin class
    const loadingIndicator = document.querySelector('.animate-spin');
    expect(loadingIndicator).toBeInTheDocument();
  });

  it('calls onSourceTextChange when text is entered', async () => {
    const onChange = vi.fn();
    const { user } = render(
      <SourceTextInput {...defaultProps} onSourceTextChange={onChange} />
    );
    
    const textarea = screen.getByPlaceholderText(/paste your text here/i);
    await user.type(textarea, 'Hello');
    
    expect(onChange).toHaveBeenCalledTimes(5); // Once for each character
  });

  it('calls onSubmit when generate button is clicked', async () => {
    const onSubmit = vi.fn();
    const { user } = render(
      <SourceTextInput {...defaultProps} onSubmit={onSubmit} isValid={true} />
    );
    
    const button = screen.getByRole('button', { name: /generate flashcards/i });
    await user.click(button);
    
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
}); 