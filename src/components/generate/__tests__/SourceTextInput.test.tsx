import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../test/utils/test-utils';
import { SourceTextInput } from '../SourceTextInput';

describe('SourceTextInput Component', () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    isLoading: false,
  };

  it('renders correctly with default props', () => {
    render(<SourceTextInput {...defaultProps} />);
    expect(screen.getByPlaceholderText(/paste your text here/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate flashcards/i })).toBeInTheDocument();
  });

  it('displays character count correctly', async () => {
    const { user } = render(<SourceTextInput {...defaultProps} />);
    
    const textarea = screen.getByPlaceholderText(/paste your text here/i);
    await user.type(textarea, 'Hello world');
    
    expect(screen.getByText('11 / 10,000')).toBeInTheDocument();
  });

  it('shows no validation message when text length is valid', async () => {
    const { user } = render(<SourceTextInput {...defaultProps} />);
    
    const textarea = screen.getByPlaceholderText(/paste your text here/i);
    const validText = 'a'.repeat(1000);
    await user.type(textarea, validText);
    
    expect(screen.queryByText(/text must be at least/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/text must not exceed/i)).not.toBeInTheDocument();
  });

  it('disables text area when loading', () => {
    render(<SourceTextInput {...defaultProps} isLoading={true} />);
    expect(screen.getByPlaceholderText(/paste your text here/i)).toBeDisabled();
  });

  it('disables generate button when text is invalid', async () => {
    const { user } = render(<SourceTextInput {...defaultProps} />);
    
    const textarea = screen.getByPlaceholderText(/paste your text here/i);
    await user.type(textarea, 'Short');
    
    expect(screen.getByRole('button', { name: /generate flashcards/i })).toBeDisabled();
  });
  
  it('disables generate button when loading', () => {
    render(<SourceTextInput {...defaultProps} isLoading={true} />);
    expect(screen.getByRole('button', { name: /generate flashcards/i })).toBeDisabled();
  });

  it('enables generate button when text is valid and not loading', async () => {
    const { user } = render(<SourceTextInput {...defaultProps} />);
    
    const textarea = screen.getByPlaceholderText(/paste your text here/i);
    const validText = 'a'.repeat(1000);
    await user.type(textarea, validText);
    
    const button = screen.getByRole('button', { name: /generate flashcards/i });
    expect(button).not.toBeDisabled();
  });

  it('shows loading indicator when isLoading is true', () => {
    render(<SourceTextInput {...defaultProps} isLoading={true} />);
    // Look for the Loader2 icon by finding the element with the animate-spin class
    const loadingIndicator = document.querySelector('.animate-spin');
    expect(loadingIndicator).toBeInTheDocument();
  });

  it('calls onSubmit when form is submitted with valid text', async () => {
    const onSubmit = vi.fn();
    const { user } = render(
      <SourceTextInput {...defaultProps} onSubmit={onSubmit} />
    );
    
    const textarea = screen.getByPlaceholderText(/paste your text here/i);
    const validText = 'a'.repeat(1000);
    await user.type(textarea, validText);
    
    const submitButton = screen.getByRole('button', { name: /generate flashcards/i });
    await user.click(submitButton);
    
    expect(onSubmit).toHaveBeenCalledWith(validText);
  });

  it('does not call onSubmit when form is submitted with invalid text', async () => {
    const onSubmit = vi.fn();
    const { user } = render(
      <SourceTextInput {...defaultProps} onSubmit={onSubmit} />
    );
    
    const textarea = screen.getByPlaceholderText(/paste your text here/i);
    await user.type(textarea, 'Short');
    
    const submitButton = screen.getByRole('button', { name: /generate flashcards/i });
    await user.click(submitButton);
    
    expect(onSubmit).not.toHaveBeenCalled();
  });
}); 