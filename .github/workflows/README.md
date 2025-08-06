# GitHub Actions Workflows

This directory contains GitHub Actions workflows for the FlashAI project.

## Pull Request Workflow (`pull-request.yml`)

The pull request workflow runs on every pull request and push to `main` and `develop` branches.

### Workflow Structure

1. **Lint Job** - Runs ESLint to check code quality
2. **Unit Tests Job** - Runs unit tests with coverage collection (depends on lint)
3. **E2E Tests Job** - Runs Playwright E2E tests (depends on lint, runs in parallel with unit tests)
4. **Status Comment Job** - Posts a status comment to the PR (depends on all previous jobs)

### Job Dependencies

```
lint
├── unit-tests
├── e2e-tests
└── status-comment (depends on all)
```

### Environment Variables

The following secrets must be configured in your GitHub repository:

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase API key
- `OPENROUTER_API_KEY` - OpenRouter API key
- `E2E_USERNAME_ID` - Test user ID for E2E tests
- `E2E_USERNAME` - Test username for E2E tests
- `E2E_PASSWORD` - Test password for E2E tests

### Coverage Collection

- **Unit Tests**: Coverage is collected using Vitest and uploaded to both Codecov and GitHub artifacts
- **E2E Tests**: Test results and reports are uploaded as GitHub artifacts

### Browser Installation

The E2E tests install only the Chromium browser as specified in the Playwright configuration to optimize CI performance.

### Status Comments

The workflow automatically posts status comments to pull requests with:

- Overall status (✅ Passed / ❌ Failed)
- Individual job results
- Automatic cleanup of previous status comments

### Artifacts

The following artifacts are uploaded and retained for 30 days:

- `unit-test-coverage` - Unit test coverage reports
- `playwright-report` - Playwright HTML test reports
- `test-results` - E2E test results

## Setup Instructions

1. Ensure all required secrets are configured in your GitHub repository settings
2. The workflow will automatically run on pull requests and pushes to protected branches
3. Coverage reports will be available in the GitHub Actions artifacts and Codecov (if configured)

## Troubleshooting

- If E2E tests fail, check that all environment variables are properly set
- Ensure the Playwright configuration matches the CI environment
- Check that the test database is accessible from GitHub Actions runners
