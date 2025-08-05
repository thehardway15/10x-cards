# Authentication E2E Testing

## Overview

This document provides information about the E2E tests for the authentication system login flow.

## Test Structure

The authentication tests follow the Page Object Model pattern and cover the following flows:

1. **Login Flow**
   - Successful login
   - Failed login with invalid credentials
   - Session persistence
   - Logout functionality

2. **Protected Routes**
   - Authentication redirection

## Page Objects

- **LoginPage**: Handles login interactions

## Test Data

Test data is managed in:

- Environment variables: Real test credentials (E2E_USERNAME, E2E_PASSWORD)
- `auth-fixtures.ts`: Contains invalid credentials for testing error scenarios

## Running Tests

```bash
# Run all authentication tests
npx playwright test authentication.spec.ts

# Run specific test group
npx playwright test authentication.spec.ts --grep "Login Flow"

# Run with UI mode for debugging
npx playwright test authentication.spec.ts --ui
```

## Test User Management

The test suite uses environment variables for authentication testing:
- E2E_USERNAME - Email for the test user
- E2E_PASSWORD - Password for the test user

These values should be defined in your `.env.test` file.

## Best Practices

1. Follow AAA (Arrange, Act, Assert) pattern in test cases
2. Use data-testid attributes for stable selectors
3. Isolate tests with independent contexts
4. Keep visual snapshots up-to-date
5. Handle auth token management properly