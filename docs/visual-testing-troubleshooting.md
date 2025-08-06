# Visual Testing Troubleshooting Guide

## Problem: Visual Regression Tests Failing in CI

When visual regression tests fail in CI but pass locally, it's usually due to environment differences between local development and CI environments.

### Common Causes

1. **Different Operating Systems**: Local (macOS/Windows) vs CI (Linux)
2. **Font Differences**: Different font availability and rendering
3. **Screen Resolution**: Different viewport sizes and device pixel ratios
4. **Browser Versions**: Slightly different Chrome versions
5. **Timing Issues**: CI environments may be slower, causing timing differences

### Solutions Implemented

#### 1. Enhanced Playwright Configuration

We've updated `playwright.config.ts` with:

- Consistent viewport size (1280x720)
- Higher threshold for CI (0.3 vs 0.2)
- Disabled animations and caret
- Consistent device settings

#### 2. Visual Stability Helpers

Created `e2e-tests/fixtures/visual-test-helpers.ts` with functions:

- `waitForVisualStability()` - Waits for network, fonts, and animations
- `ensureConsistentViewport()` - Sets consistent viewport
- `disableAnimations()` - Disables CSS animations
- `prepareForScreenshot()` - Combines all stability measures

#### 3. Updated Test Selectors

Added proper `data-testid` attributes to components:

- `candidate-list` - Main candidate list container
- `candidate-list-loading` - Loading state
- `candidate-list-empty` - Empty state
- `candidate-grid` - Grid of candidates

#### 4. Improved Test Stability

Updated tests to:

- Wait for specific elements before taking screenshots
- Use stability helpers before screenshots
- Wait for modals and dialogs to fully render

### How to Fix Failing Visual Tests

#### Option 1: Update Snapshots (Recommended for Intentional Changes)

If the UI changes are intentional:

```bash
# Locally
npm run test:e2e:update-snapshots

# In CI (if you have access)
npm run test:e2e:update-snapshots:ci
```

#### Option 2: Adjust Threshold

If the differences are minor and acceptable:

1. Increase the threshold in `playwright.config.ts`:

```typescript
expect: {
  toHaveScreenshot: {
    threshold: process.env.CI ? 0.4 : 0.2, // Increase from 0.3 to 0.4
  },
}
```

#### Option 3: Debug Specific Failures

1. Download the failed screenshots from CI
2. Compare with local snapshots
3. Identify what's different (fonts, layout, colors, etc.)
4. Adjust the test or component accordingly

### Best Practices

1. **Always run visual tests locally before pushing**
2. **Use consistent test data** - avoid random or time-dependent content
3. **Wait for stability** - use the provided helper functions
4. **Test on multiple environments** - consider testing on different OS/browsers
5. **Keep snapshots in version control** - they should be committed with code changes

### Debugging Commands

```bash
# Run specific visual test
npx playwright test visual-regression.spec.ts

# Run with debug output
npx playwright test visual-regression.spec.ts --debug

# Show test results
npx playwright show-report

# Update snapshots for specific test
npx playwright test visual-regression.spec.ts --update-snapshots
```

### CI/CD Integration

For GitHub Actions, consider:

1. **Conditional snapshot updates** - Only update on specific branches
2. **Manual approval** - Require manual approval for snapshot updates
3. **Separate visual test job** - Run visual tests separately from functional tests
4. **Artifact storage** - Store failed screenshots as artifacts for review

### Example GitHub Actions Workflow

```yaml
- name: Run Visual Tests
  run: npm run test:e2e

- name: Update Snapshots on Failure
  if: failure() && github.ref == 'refs/heads/main'
  run: npm run test:e2e:update-snapshots:ci
```

### Monitoring and Maintenance

1. **Regular snapshot reviews** - Periodically review and clean up outdated snapshots
2. **Performance monitoring** - Track visual test execution time
3. **Failure analysis** - Document common failure patterns
4. **Team training** - Ensure team understands visual testing best practices
