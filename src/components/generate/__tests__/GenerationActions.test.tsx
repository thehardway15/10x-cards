import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../../../test/utils/test-utils";
import { GenerationActions } from "../GenerationActions";
import type { GenerationCandidateViewModel } from "@/lib/hooks/useGeneration";

describe("GenerationActions Component", () => {
  const mockCandidates: GenerationCandidateViewModel[] = [
    {
      candidateId: "id1",
      front: "Front 1",
      back: "Back 1",
      source: "ai-full",
      status: "idle",
    },
    {
      candidateId: "id2",
      front: "Front 2",
      back: "Back 2",
      source: "ai-full",
      status: "saving",
    },
    {
      candidateId: "id3",
      front: "Front 3",
      back: "Back 3",
      source: "ai-full",
      status: "idle",
    },
  ];

  const defaultProps = {
    candidates: mockCandidates,
    onBulkAccept: vi.fn(),
    isProcessing: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the Accept All button with correct count", () => {
    render(<GenerationActions {...defaultProps} />);

    expect(screen.getByRole("button", { name: /Accept All \(2\)/ })).toBeInTheDocument();
  });

  it("calls onBulkAccept with available candidate IDs when clicked", async () => {
    const onBulkAccept = vi.fn();
    const { user } = render(<GenerationActions {...defaultProps} onBulkAccept={onBulkAccept} />);

    const acceptButton = screen.getByRole("button", { name: /Accept All \(2\)/ });
    await user.click(acceptButton);

    expect(onBulkAccept).toHaveBeenCalledWith(["id1", "id3"]);
  });

  it("disables button when no available candidates", () => {
    const noAvailableCandidates = mockCandidates.map((c) => ({ ...c, status: "saving" as const }));

    render(<GenerationActions {...defaultProps} candidates={noAvailableCandidates} />);

    const acceptButton = screen.getByRole("button", { name: /Accept All \(0\)/ });
    expect(acceptButton).toBeDisabled();
  });

  it("disables button when processing", () => {
    render(<GenerationActions {...defaultProps} isProcessing={true} />);

    const acceptButton = screen.getByRole("button", { name: /Accept All \(2\)/ });
    expect(acceptButton).toBeDisabled();
  });

  it("shows correct count when all candidates are available", () => {
    const allAvailableCandidates = mockCandidates.map((c) => ({ ...c, status: "idle" as const }));

    render(<GenerationActions {...defaultProps} candidates={allAvailableCandidates} />);

    expect(screen.getByRole("button", { name: /Accept All \(3\)/ })).toBeInTheDocument();
  });
});
