# Testing Guide

This project uses a comprehensive testing strategy with multiple layers:

1. **Unit Tests** - Using Vitest
2. **Component Tests** - Using Vitest with Testing Library and jsdom
3. **E2E Tests** - Using Playwright

## Running Tests

### Unit and Component Tests

```bash
# Run all tests
npm test

# Run with watch mode (rerun on file changes)
npm run test:watch

# Run with UI for better debugging
npm run test:ui

# Generate coverage report
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only component tests
npm run test:component
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI for debugging
npm run test:e2e:ui

# Generate tests using Playwright's codegen tool
npm run test:e2e:codegen
```

## Test Structure

### Unit Tests

Unit tests are located near the files they test with a `.test.ts` or `.test.tsx` suffix.

Example:

```
src/
  lib/
    services/
      flashcards.service.ts
      flashcards.service.test.ts  # Unit test for service
```

### Component Tests

Component tests use the `.component.test.tsx` suffix to distinguish them from other tests.

Example:

```
src/
  components/
    ui/
      button.tsx
      __tests__/
        button.component.test.tsx  # Component test for Button
```

### E2E Tests

E2E tests are located in a separate `e2e-tests` directory at the project root, using the Page Object Model pattern for better maintainability.

```
e2e-tests/
  home.spec.ts                # Test file
  page-objects/               # Page Object Models
    HomePage.ts
  fixtures/                   # Test data and fixtures
    test-users.ts
```

## Testing Utilities

### MSW for API Mocking

Mock Service Worker (MSW) is used for mocking API responses in both unit and component tests. Handlers are defined in `src/test/mocks/handlers.ts`.

### Custom Render Function

A custom render function is provided in `src/test/utils/test-utils.tsx` to simplify test setup with providers, context, etc.

### Supabase Client Mocking

A mock Supabase client is provided for testing Supabase interactions in `src/test/utils/test-utils.tsx`.

## Best Practices

### Unit Tests

- Test pure business logic and service methods
- Mock external dependencies
- Focus on input/output relationships
- Test edge cases and error paths

### Component Tests

- Focus on user interactions and rendering
- Use Testing Library queries that reflect how users interact with the UI
- Prefer role-based queries over test IDs when possible
- Mock API responses with MSW

### E2E Tests

- Focus on critical user flows and journeys
- Use Page Object Model for better maintainability
- Leverage Playwright's powerful capabilities for cross-browser testing
- Use visual testing for complex UI components

## CI Integration

This testing setup is designed to work in CI environments. The CI configuration will:

1. Run linting
2. Run unit and component tests
3. Run E2E tests
4. Generate and upload coverage reports
