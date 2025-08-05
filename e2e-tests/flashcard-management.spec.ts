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