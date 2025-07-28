import type { ReactElement } from 'react';
import { render as rtlRender } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

// Custom render for adding providers, context, etc.
function render(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return {
    ...rtlRender(ui, options),
    // Return userEvent instance for convenience
    user: userEvent.setup()
  };
}

// Re-export everything from testing-library
export * from '@testing-library/react';
// Override render method with our custom version
export { render };

// Mock functions for tests
export const mockSupabaseClient = {
  auth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
  },
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    match: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    then: vi.fn().mockImplementation((callback) => Promise.resolve(callback({ data: [], error: null }))),
  }),
};

// Helper for mocking fetch responses
export const mockFetchResponse = (data: any, status = 200) => {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers(),
  };
}; 