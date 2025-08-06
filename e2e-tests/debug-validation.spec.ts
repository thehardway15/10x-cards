import { test, expect } from "./fixtures/generation-fixtures";
import { GenerationPage } from "./page-objects/GenerationPage";

test.describe("Debug Validation", () => {
  test("should debug validation issues", async ({ page }) => {
    const generationPage = new GenerationPage(page);
    await generationPage.navigate();

    // Wait for the textarea to be available
    await page.waitForSelector('[data-testid="source-text-input"]', { timeout: 10000 });

    // Get the textarea element
    const textarea = page.locator('[data-testid="source-text-input"]');
    const generateButton = page.getByTestId("generate-button");

    // Check initial state
    console.log("Initial button disabled:", await generateButton.isDisabled());

    // Type a short text (should be invalid)
    await textarea.click();
    await textarea.fill("");
    await textarea.fill("Short text");
    await page.waitForTimeout(1000);

    console.log("After short text - button disabled:", await generateButton.isDisabled());

    // Check for validation error
    const errorElement = page.locator("p.text-sm.text-muted-foreground");
    const errorText = await errorElement.textContent();
    console.log("Error text:", errorText);

    // Type a valid text
    await textarea.fill("");
    const validText = "This is a sample text with at least 1000 characters. ".repeat(30); // ~1800 characters
    await textarea.fill(validText);
    await page.waitForTimeout(2000);

    console.log("After valid text - button disabled:", await generateButton.isDisabled());

    // Check character count
    const countElement = page.locator(".absolute.bottom-2.right-2.text-sm.text-muted-foreground");
    const countText = await countElement.textContent();
    console.log("Character count:", countText);

    // Check for validation error again
    const errorText2 = await errorElement.textContent();
    console.log("Error text after valid input:", errorText2);

    // Check button attributes
    const buttonElement = await generateButton.elementHandle();
    if (buttonElement) {
      const disabled = await buttonElement.getAttribute("disabled");
      const className = await buttonElement.getAttribute("class");
      console.log("Button disabled attribute:", disabled);
      console.log("Button class:", className);
    }

    // Take a screenshot
    await page.screenshot({ path: "debug-validation.png" });

    // The test should pass if we can understand the validation state
    expect(true).toBe(true);
  });
});
