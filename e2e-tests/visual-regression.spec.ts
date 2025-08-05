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