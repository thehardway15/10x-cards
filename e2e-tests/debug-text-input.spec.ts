import { test, expect } from "./fixtures/generation-fixtures";
import { GenerationPage } from "./page-objects/GenerationPage";

test.describe("Debug Text Input", () => {
  test("should handle text input correctly", async ({ page }) => {
    const generationPage = new GenerationPage(page);
    await generationPage.navigate();

    // Wait for the textarea to be available
    await page.waitForSelector('[data-testid="source-text-input"]', { timeout: 10000 });

    // Get the textarea element
    const textarea = page.locator('[data-testid="source-text-input"]');

    // Clear and type a short text first
    await textarea.click();
    await textarea.fill("");
    await textarea.type("Short text");

    // Check character count - use a more specific selector
    await page.waitForTimeout(1000);
    const countElement = page.locator(".absolute.bottom-2.right-2.text-sm.text-muted-foreground");
    const countText = await countElement.textContent();
    console.log("Character count after short text:", countText);

    // Now type a longer text
    await textarea.fill("");
    const longText = "This is a sample text with at least 1000 characters...".repeat(20);
    await textarea.type(longText);

    // Wait and check character count again
    await page.waitForTimeout(2000);
    const countText2 = await countElement.textContent();
    console.log("Character count after long text:", countText2);

    // Check if the button is enabled
    const generateButton = page.getByTestId("generate-button");
    const isDisabled = await generateButton.isDisabled();
    console.log("Generate button disabled:", isDisabled);

    // Try to click the generate button
    if (!isDisabled) {
      console.log("Attempting to click generate button...");
      await generateButton.click();

      // Wait for generation to start
      await page.waitForTimeout(3000);

      // Check if candidates appeared
      const candidates = page.locator('[data-testid^="candidate-item-"]');
      const candidateCount = await candidates.count();
      console.log("Number of candidates found:", candidateCount);

      expect(candidateCount).toBeGreaterThan(0);
    }

    // Take a screenshot for debugging
    await page.screenshot({ path: "debug-text-input.png" });

    // The test should pass if we can type the text without it being reset
    expect(countText2).toContain("1,080");
  });
});
