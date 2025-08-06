import { afterEach, beforeAll, afterAll } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import { setupServer } from "msw/node";
import { handlers } from "./mocks/handlers";

// Automatically cleanup after each test
afterEach(() => {
  cleanup();
});

// Export MSW server for API mocking
export const server = setupServer(...handlers);

// Setup MSW server before and after all tests
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
