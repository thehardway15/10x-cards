# Flashcard Generation Component E2E Test Plan

## Overview

This document outlines the end-to-end testing strategy for the Flashcard Generation feature using Playwright. The test plan covers the complete user flow from entering source text to accepting, editing, or rejecting generated flashcards.

## Test Environment Setup

### Browser Configuration
- Use Chromium/Desktop Chrome browser only
- Configure viewport size to test both desktop (1280x720) and tablet (768x1024) views

### Test Data
- Create fixture data for:
  - Sample source texts of various lengths
  - Mock API responses for flashcard generation
  - Mock flashcard candidates with different states

### Authentication Setup
- Use environment variables for test user credentials (E2E_USERNAME_ID, E2E_USERNAME, E2E_PASSWORD)
- Ensure all tests run with authenticated user session
- All created flashcards must be associated with the test user

### API Mocking Strategy
- Intercept API calls to `/api/generations` endpoint
- Return predetermined flashcard candidates instead of calling OpenRouter
- Mock flashcard persistence endpoints (`/api/flashcards`)

### Test Data Cleanup
- Track all created flashcards during tests
- Clean up all created data after test completion
- Use global setup/teardown to ensure clean test environment

## Page Objects

Create the following Page Object classes in `e2e-tests/page-objects/`:

### 1. GenerationPage
```typescript
// e2e-tests/page-objects/GenerationPage.ts
export class GenerationPage {
  readonly page: Page;
  
  constructor(page: Page) {
    this.page = page;
  }
  
  async navigate() {
    await this.page.goto('/generate');
  }
  
  async enterSourceText(text: string) {
    await this.page.getByTestId('source-text-input').fill(text);
  }
  
  async clickGenerateButton() {
    await this.page.getByRole('button', { name: 'Generate Flashcards' }).click();
  }
  
  async getCharacterCount() {
    const countText = await this.page.locator('.text-muted-foreground').textContent();
    return countText ? parseInt(countText.split('/')[0].trim()) : 0;
  }
  
  async getFlashcardCandidateCount() {
    return await this.page.getByTestId(/^candidate-item/).count();
  }
  
  async clickAcceptAllButton() {
    await this.page.getByRole('button', { name: /Accept All/ }).click();
  }
  
  async acceptCandidate(index: number) {
    await this.page.getByTestId(/^candidate-item/).nth(index)
      .getByRole('button', { name: 'Accept' }).click();
  }
  
  async editCandidate(index: number) {
    await this.page.getByTestId(/^candidate-item/).nth(index)
      .getByRole('button', { name: 'Edit' }).click();
  }
  
  async rejectCandidate(index: number) {
    await this.page.getByTestId(/^candidate-item/).nth(index)
      .getByRole('button', { name: 'Reject' }).click();
  }
  
  async confirmReject() {
    await this.page.getByRole('button', { name: 'Reject' }).click();
  }
  
  async cancelReject() {
    await this.page.getByRole('button', { name: 'Cancel' }).click();
  }
}
```

### 2. EditFlashcardModal
```typescript
// e2e-tests/page-objects/EditFlashcardModal.ts
export class EditFlashcardModal {
  readonly page: Page;
  
  constructor(page: Page) {
    this.page = page;
  }
  
  async isVisible() {
    return await this.page.getByRole('dialog').isVisible();
  }
  
  async getFrontText() {
    return await this.page.getByLabel(/Front Side/).inputValue();
  }
  
  async getBackText() {
    return await this.page.getByLabel(/Back Side/).inputValue();
  }
  
  async setFrontText(text: string) {
    await this.page.getByLabel(/Front Side/).fill(text);
  }
  
  async setBackText(text: string) {
    await this.page.getByLabel(/Back Side/).fill(text);
  }
  
  async saveChanges() {
    await this.page.getByRole('button', { name: 'Save Changes' }).click();
  }
  
  async cancel() {
    await this.page.getByRole('button', { name: 'Cancel' }).click();
  }
}
```

## Test Fixtures

Create fixtures for API mocking and test data:

```typescript
// e2e-tests/fixtures/generation-fixtures.ts
import { test as base } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage';
import type { GenerationCandidateViewModel } from '@/lib/hooks/useGeneration';

// Mock candidate data
export const mockCandidates: GenerationCandidateViewModel[] = [
  {
    candidateId: 'mock-id-1',
    front: 'What is the capital of France?',
    back: 'Paris is the capital of France.',
    source: 'ai-full',
    status: 'idle'
  },
  {
    candidateId: 'mock-id-2',
    front: 'What is the largest planet in our solar system?',
    back: 'Jupiter is the largest planet in our solar system.',
    source: 'ai-full',
    status: 'idle'
  },
  {
    candidateId: 'mock-id-3',
    front: 'Who wrote "Romeo and Juliet"?',
    back: 'William Shakespeare wrote "Romeo and Juliet".',
    source: 'ai-full',
    status: 'idle'
  }
];

// Storage for tracking created flashcard IDs for cleanup
export const testData = {
  createdFlashcardIds: new Set<string>()
};

// Extended test fixture with mocked API and authentication
export const test = base.extend({
  page: async ({ page, browser }, use) => {
    // Load environment variables
    const username = process.env.E2E_USERNAME || '';
    const password = process.env.E2E_PASSWORD || '';
    const userId = process.env.E2E_USERNAME_ID || '';
    
    // Authenticate the user first
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(username, password);
    
    // Wait for authentication to complete
    await page.waitForURL('/generate');
    
    // Mock the generations API endpoint
    await page.route('**/api/generations', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          candidates: mockCandidates,
          totalCount: mockCandidates.length
        })
      });
    });

    // Mock flashcard save API endpoint and track created IDs
    await page.route('**/api/flashcards', async (route) => {
      const method = route.request().method();
      if (method === 'POST') {
        // Generate a unique ID for the flashcard
        const id = `test-flashcard-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        
        // Add the ID to the tracking set
        testData.createdFlashcardIds.add(id);
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            success: true, 
            id: id,
            userId: userId // Associate with test user
          })
        });
      }
    });

    // Mock flashcard delete API endpoint
    await page.route('**/api/flashcards/**', async (route) => {
      const method = route.request().method();
      if (method === 'DELETE') {
        // Extract ID from URL
        const url = route.request().url();
        const id = url.split('/').pop() || '';
        
        // Remove from tracking set if it exists
        if (testData.createdFlashcardIds.has(id)) {
          testData.createdFlashcardIds.delete(id);
        }
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      }
    });

    // Use the page with mocked endpoints
    await use(page);
    
    // Cleanup: Delete any remaining test flashcards
    if (testData.createdFlashcardIds.size > 0) {
      console.log(`Cleaning up ${testData.createdFlashcardIds.size} test flashcards...`);
      
      // Create a new context for cleanup to ensure auth state
      const cleanupContext = await browser.newContext();
      const cleanupPage = await cleanupContext.newPage();
      
      // Login for cleanup
      const cleanupLoginPage = new LoginPage(cleanupPage);
      await cleanupLoginPage.goto();
      await cleanupLoginPage.login(username, password);
      await cleanupPage.waitForURL('/generate');
      
      // Delete each tracked flashcard
      for (const id of testData.createdFlashcardIds) {
        try {
          await cleanupPage.request.delete(`/api/flashcards/${id}`); 
          console.log(`Deleted test flashcard: ${id}`);
        } catch (error) {
          console.error(`Failed to delete test flashcard ${id}: ${error}`);
        }
      }
      
      // Clear the tracking set
      testData.createdFlashcardIds.clear();
      
      // Close cleanup context
      await cleanupContext.close();
    }
  }
});

export { expect } from '@playwright/test';
```

## Test Cases

### 1. Basic Generation Flow

```typescript
// e2e-tests/generation.spec.ts
import { test, expect, mockCandidates } from './fixtures/generation-fixtures';
import { GenerationPage } from './page-objects/GenerationPage';

test.describe('Flashcard Generation', () => {
  test('should generate flashcards from source text', async ({ page }) => {
    // Arrange
    const generationPage = new GenerationPage(page);
    await generationPage.navigate();
    
    // Act
    await generationPage.enterSourceText('This is a sample text with at least 1000 characters...'.repeat(20));
    await generationPage.clickGenerateButton();
    
    // Assert
    expect(await generationPage.getFlashcardCandidateCount()).toBe(3);
    await expect(page).toHaveScreenshot('generation-results.png');
  });

  test('should show validation message for short text', async ({ page }) => {
    // Arrange
    const generationPage = new GenerationPage(page);
    await generationPage.navigate();
    
    // Act
    await generationPage.enterSourceText('Too short text');
    
    // Assert
    await expect(page.getByText('Text must be at least 1,000 characters')).toBeVisible();
    expect(await page.getByRole('button', { name: 'Generate Flashcards' })).toBeDisabled();
  });

  test('should show validation message for long text', async ({ page }) => {
    // Arrange
    const generationPage = new GenerationPage(page);
    await generationPage.navigate();
    
    // Act
    await generationPage.enterSourceText('A'.repeat(11000));
    
    // Assert
    await expect(page.getByText('Text must not exceed 10,000 characters')).toBeVisible();
    expect(await page.getByRole('button', { name: 'Generate Flashcards' })).toBeDisabled();
  });
});
```

### 2. Flashcard Management

```typescript
// e2e-tests/flashcard-management.spec.ts
import { test, expect } from './fixtures/generation-fixtures';
import { GenerationPage } from './page-objects/GenerationPage';
import { EditFlashcardModal } from './page-objects/EditFlashcardModal';

test.describe('Flashcard Management', () => {
  test.beforeEach(async ({ page }) => {
    const generationPage = new GenerationPage(page);
    await generationPage.navigate();
    await generationPage.enterSourceText('This is a sample text with at least 1000 characters...'.repeat(20));
    await generationPage.clickGenerateButton();
  });
  
  test('should accept a flashcard candidate', async ({ page }) => {
    // Arrange
    const generationPage = new GenerationPage(page);
    
    // Act
    await generationPage.acceptCandidate(0);
    
    // Assert
    await expect(page.getByText('Flashcard saved successfully!')).toBeVisible();
  });
  
  test('should reject a flashcard candidate with confirmation', async ({ page }) => {
    // Arrange
    const generationPage = new GenerationPage(page);
    
    // Act
    await generationPage.rejectCandidate(0);
    await generationPage.confirmReject();
    
    // Assert
    await expect(page.getByText('Flashcard rejected')).toBeVisible();
  });
  
  test('should cancel flashcard rejection', async ({ page }) => {
    // Arrange
    const generationPage = new GenerationPage(page);
    
    // Act
    await generationPage.rejectCandidate(0);
    await generationPage.cancelReject();
    
    // Assert
    await expect(page.getByRole('alertdialog')).not.toBeVisible();
    // Verify the candidate is still visible
    expect(await generationPage.getFlashcardCandidateCount()).toBe(3);
  });
  
  test('should edit and save a flashcard candidate', async ({ page }) => {
    // Arrange
    const generationPage = new GenerationPage(page);
    const editModal = new EditFlashcardModal(page);
    
    // Act - Edit first candidate
    await generationPage.editCandidate(0);
    await expect(editModal.isVisible()).toBeTruthy();
    
    // Modify content
    await editModal.setFrontText('Modified question');
    await editModal.setBackText('Modified answer');
    await editModal.saveChanges();
    
    // Assert
    await expect(page.getByText('Flashcard updated successfully!')).toBeVisible();
    // Verify the "Edited" badge appears
    await expect(page.getByText('Edited')).toBeVisible();
  });
  
  test('should accept all flashcards in bulk', async ({ page }) => {
    // Arrange
    const generationPage = new GenerationPage(page);
    
    // Act
    await generationPage.clickAcceptAllButton();
    
    // Assert
    await expect(page.getByText('Successfully saved 3 flashcards')).toBeVisible();
  });
});
```

### 3. Edit Modal Validation

```typescript
// e2e-tests/edit-modal-validation.spec.ts
import { test, expect } from './fixtures/generation-fixtures';
import { GenerationPage } from './page-objects/GenerationPage';
import { EditFlashcardModal } from './page-objects/EditFlashcardModal';

test.describe('Edit Flashcard Modal Validation', () => {
  test.beforeEach(async ({ page }) => {
    const generationPage = new GenerationPage(page);
    await generationPage.navigate();
    await generationPage.enterSourceText('This is a sample text with at least 1000 characters...'.repeat(20));
    await generationPage.clickGenerateButton();
    await generationPage.editCandidate(0);
  });
  
  test('should validate empty fields', async ({ page }) => {
    // Arrange
    const editModal = new EditFlashcardModal(page);
    
    // Act - Clear fields
    await editModal.setFrontText('');
    await editModal.setBackText('');
    await editModal.saveChanges();
    
    // Assert
    await expect(page.getByText('Front side cannot be empty')).toBeVisible();
    await expect(page.getByText('Back side cannot be empty')).toBeVisible();
  });
  
  test('should validate front side length', async ({ page }) => {
    // Arrange
    const editModal = new EditFlashcardModal(page);
    
    // Act - Set too long text
    await editModal.setFrontText('A'.repeat(201));
    await editModal.saveChanges();
    
    // Assert
    await expect(page.getByText('Front side cannot exceed 200 characters')).toBeVisible();
  });
  
  test('should validate back side length', async ({ page }) => {
    // Arrange
    const editModal = new EditFlashcardModal(page);
    
    // Act - Set too long text
    await editModal.setBackText('A'.repeat(501));
    await editModal.saveChanges();
    
    // Assert
    await expect(page.getByText('Back side cannot exceed 500 characters')).toBeVisible();
  });
});
```

## Visual Regression Testing

```typescript
// e2e-tests/visual-regression.spec.ts
import { test, expect } from './fixtures/generation-fixtures';
import { GenerationPage } from './page-objects/GenerationPage';
import { EditFlashcardModal } from './page-objects/EditFlashcardModal';

test.describe('Visual Regression Tests', () => {
  test('generation page should match snapshot', async ({ page }) => {
    const generationPage = new GenerationPage(page);
    await generationPage.navigate();
    
    await expect(page).toHaveScreenshot('generation-page-empty.png');
  });
  
  test('flashcard candidates should match snapshot', async ({ page }) => {
    const generationPage = new GenerationPage(page);
    await generationPage.navigate();
    await generationPage.enterSourceText('This is a sample text with at least 1000 characters...'.repeat(20));
    await generationPage.clickGenerateButton();
    
    await expect(page).toHaveScreenshot('flashcard-candidates.png');
  });
  
  test('edit modal should match snapshot', async ({ page }) => {
    const generationPage = new GenerationPage(page);
    await generationPage.navigate();
    await generationPage.enterSourceText('This is a sample text with at least 1000 characters...'.repeat(20));
    await generationPage.clickGenerateButton();
    await generationPage.editCandidate(0);
    
    await expect(page).toHaveScreenshot('edit-flashcard-modal.png');
  });
  
  test('confirm dialog should match snapshot', async ({ page }) => {
    const generationPage = new GenerationPage(page);
    await generationPage.navigate();
    await generationPage.enterSourceText('This is a sample text with at least 1000 characters...'.repeat(20));
    await generationPage.clickGenerateButton();
    await generationPage.rejectCandidate(0);
    
    await expect(page).toHaveScreenshot('confirm-reject-dialog.png');
  });
});
```

## Implementation Plan

1. Create the page object classes in e2e-tests/page-objects/
2. Set up environment variables for test user credentials
3. Configure authentication and test data cleanup mechanisms
4. Set up the test fixtures for API mocking
5. Implement the basic generation flow tests
6. Implement flashcard management tests
7. Implement edit modal validation tests
8. Set up visual regression tests
9. Create global setup/teardown for database cleanup
10. Run tests in CI pipeline

## Global Setup and Teardown

```typescript
// e2e-tests/global-setup.ts
import { request } from '@playwright/test';
import dotenv from 'dotenv';

async function globalSetup() {
  // Load environment variables
  dotenv.config({ path: '.env.test' });
  
  // Verify required environment variables
  const requiredEnvVars = ['E2E_USERNAME', 'E2E_PASSWORD', 'E2E_USERNAME_ID'];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Required environment variable ${envVar} is not set. Please check your .env.test file.`);
    }
  }
  
  // Optional: Clean up any leftover data from previous test runs
  try {
    // Create a request context for API calls
    const apiContext = await request.newContext();
    
    // Authenticate
    const loginResponse = await apiContext.post('/api/auth/login', {
      data: {
        email: process.env.E2E_USERNAME,
        password: process.env.E2E_PASSWORD
      }
    });
    
    // Get auth token
    const responseBody = await loginResponse.json();
    const token = responseBody.token;
    
    if (token) {
      // Get all user's flashcards created in previous test runs (if any)
      const flashcardsResponse = await apiContext.get('/api/flashcards', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const flashcards = await flashcardsResponse.json();
      
      // Delete all test flashcards (you might want to identify them by a special tag or naming pattern)
      for (const flashcard of flashcards.filter(f => f.front.startsWith('Test:') || f.source === 'e2e-test')) {
        await apiContext.delete(`/api/flashcards/${flashcard.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log(`Cleaned up test flashcard: ${flashcard.id}`);
      }
    }
    
    // Close the API context
    await apiContext.dispose();
  } catch (error) {
    console.error('Failed to clean up test data:', error);
    // Continue with tests even if cleanup fails
  }
}

export default globalSetup;
```

## Test Coverage Matrix

| Feature | Test Case | Priority |
|---------|-----------|----------|
| Source Text Input | Validation for short text | High |
| Source Text Input | Validation for long text | High |
| Source Text Input | Character count display | Medium |
| Generation | Generate flashcards from valid text | High |
| Generation | Loading state during generation | Medium |
| Candidate Management | Accept a flashcard | High |
| Candidate Management | Reject a flashcard (with confirmation) | High |
| Candidate Management | Cancel flashcard rejection | Medium |
| Candidate Management | Edit a flashcard | High |
| Candidate Management | Accept all flashcards | High |
| Edit Modal | Field validation | High |
| Edit Modal | Character limits | Medium |
| Edit Modal | Save changes | High |
| Edit Modal | Cancel changes | Medium |
| Visual Regression | All key components | Medium |