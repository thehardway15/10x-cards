# Testing Guidelines

This document outlines how to work with tests in our project.

## Unit Tests (Vitest)

Unit tests are used to test individual functions and components in isolation.

### Running Unit Tests

- `npm test` - Run all unit tests
- `npm run test:watch` - Run tests in watch mode (will re-run on file changes)
- `npm run test:ui` - Run tests with UI for better debugging
- `npm run test:coverage` - Run tests with coverage report

### Writing Unit Tests

Follow these best practices:

1. Place tests near the code being tested with `.test.ts` or `.test.tsx` suffix
2. Use `describe` blocks to group related tests
3. Use descriptive test names with the pattern "should [expected behavior]"
4. Follow the AAA pattern (Arrange, Act, Assert)
5. Use `vi.mock()` for mocking dependencies
6. Test edge cases and error conditions
7. Keep tests isolated from each other

Example:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MyComponent } from "./MyComponent";

describe("MyComponent", () => {
  it("should render correctly", () => {
    // Arrange
    render(<MyComponent />);

    // Assert
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  it("should handle click events", async () => {
    // Arrange
    const onClickMock = vi.fn();
    render(<MyComponent onClick={onClickMock} />);

    // Act
    const user = userEvent.setup();
    await user.click(screen.getByRole("button"));

    // Assert
    expect(onClickMock).toHaveBeenCalledTimes(1);
  });
});
```

## E2E Tests (Playwright)

E2E tests verify that the application works correctly as a whole, testing user flows.

### Running E2E Tests

- `npm run test:e2e` - Run all E2E tests
- `npm run test:e2e:ui` - Run E2E tests with UI for debugging
- `npm run test:e2e:codegen` - Open Playwright codegen tool for recording tests

### Writing E2E Tests

Follow these best practices:

1. Use the Page Object Model pattern for maintainability
2. Test realistic user flows and journeys
3. Make tests independent from each other
4. Use unique test selectors (data-testid attributes)
5. Avoid depending on text content that might change
6. Handle asynchronous operations properly
7. Use screenshots and visual comparisons for complex UI

Example:

```ts
import { test, expect } from "@playwright/test";
import { LoginPage } from "./page-objects/LoginPage";
import { DashboardPage } from "./page-objects/DashboardPage";

test.describe("User authentication", () => {
  test("should login successfully with valid credentials", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Act
    await loginPage.login("testuser@example.com", "password123");

    // Assert
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.expectUserLoggedIn("testuser");
  });
});
```
