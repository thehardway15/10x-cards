import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";

// This is a simple example component for testing
function Counter() {
  const [count, setCount] = React.useState(0);
  return (
    <div>
      <p data-testid="count">Count: {count}</p>
      <button onClick={() => setCount((prev) => prev + 1)}>Increment</button>
    </div>
  );
}

describe("Counter Component", () => {
  it("renders with initial count of 0", () => {
    render(<Counter />);
    expect(screen.getByTestId("count")).toHaveTextContent("Count: 0");
  });

  it("increments count when button is clicked", async () => {
    render(<Counter />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /increment/i }));

    expect(screen.getByTestId("count")).toHaveTextContent("Count: 1");
  });
});
