import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../../../test/utils/test-utils";
import { ConfirmActionDialog } from "../ConfirmActionDialog";

describe("ConfirmActionDialog Component", () => {
  const defaultProps = {
    isOpen: true,
    onOpenChange: vi.fn(),
    onConfirm: vi.fn(),
  };

  it("renders the dialog when isOpen is true", () => {
    render(<ConfirmActionDialog {...defaultProps} />);

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText("Reject Flashcard")).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to reject this flashcard/i)).toBeInTheDocument();
  });

  it("does not render the dialog when isOpen is false", () => {
    render(<ConfirmActionDialog {...defaultProps} isOpen={false} />);

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("shows cancel and confirm buttons", () => {
    render(<ConfirmActionDialog {...defaultProps} />);

    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reject/i })).toBeInTheDocument();
  });

  it("calls onConfirm when confirm button is clicked", async () => {
    const onConfirm = vi.fn();
    const { user } = render(<ConfirmActionDialog {...defaultProps} onConfirm={onConfirm} />);

    const confirmButton = screen.getByRole("button", { name: /reject/i });
    await user.click(confirmButton);

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onOpenChange when cancel button is clicked", async () => {
    const onOpenChange = vi.fn();
    const { user } = render(<ConfirmActionDialog {...defaultProps} onOpenChange={onOpenChange} />);

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("applies destructive styling to the confirm button", () => {
    render(<ConfirmActionDialog {...defaultProps} />);

    const confirmButton = screen.getByRole("button", { name: /reject/i });
    expect(confirmButton).toHaveClass("bg-destructive");
  });
});
