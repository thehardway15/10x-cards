import { test, expect } from "./fixtures/generation-fixtures";
import { GenerationPage } from "./page-objects/GenerationPage";

test.describe("Debug Render", () => {
  test("should render source text input component", async ({ page }) => {
    const generationPage = new GenerationPage(page);
    await generationPage.navigate();

    // Check if the textarea is visible
    await page.waitForSelector('[data-testid="source-text-input"]', { timeout: 10000 });

    // Check if the generate button is visible
    await page.waitForSelector('[data-testid="generate-button"]', { timeout: 10000 });

    // Check if the placeholder text is visible
    const textarea = page.locator('[data-testid="source-text-input"]');
    const placeholder = await textarea.getAttribute("placeholder");
    console.log("Placeholder text:", placeholder);

    // Check if the character count is visible
    const charCount = page.locator(".absolute.bottom-2.right-2.text-sm.text-muted-foreground");
    const countText = await charCount.textContent();
    console.log("Character count text:", countText);

    // Check if the generate button is disabled initially
    const generateButton = page.getByTestId("generate-button");
    const isDisabled = await generateButton.isDisabled();
    console.log("Generate button disabled initially:", isDisabled);

    // Take a screenshot
    await page.screenshot({ path: "debug-render.png" });

    // The test should pass if the component is rendered
    expect(placeholder).toContain("Paste your text here");
    expect(countText).toContain("0 / 10,000");
    expect(isDisabled).toBe(true);
  });
});
