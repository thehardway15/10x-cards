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