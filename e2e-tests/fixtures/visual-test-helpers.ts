import { Page } from "@playwright/test";

/**
 * Helper functions for stabilizing visual regression tests
 * These functions help ensure consistent screenshots across different environments
 */

export async function waitForVisualStability(page: Page): Promise<void> {
  // Wait for network to be idle
  await page.waitForLoadState("networkidle");

  // Wait for any animations to complete
  await page.waitForTimeout(1000);

  // Wait for fonts to load
  await page.evaluate(() => {
    return document.fonts.ready;
  });

  // Wait for any pending renders
  await page.waitForTimeout(500);
}

export async function ensureConsistentViewport(page: Page): Promise<void> {
  // Set consistent viewport size
  await page.setViewportSize({ width: 1280, height: 720 });

  // Wait for layout to stabilize
  await page.waitForTimeout(200);
}

export async function disableAnimations(page: Page): Promise<void> {
  // Disable CSS animations and transitions
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `,
  });
}

export async function prepareForScreenshot(page: Page): Promise<void> {
  await ensureConsistentViewport(page);
  await disableAnimations(page);
  await waitForVisualStability(page);
}

/**
 * Custom screenshot function that ensures stability before taking screenshot
 */
export async function takeStableScreenshot(page: Page, name: string): Promise<void> {
  await prepareForScreenshot(page);

  // Take screenshot with additional stability measures
  await page.screenshot({
    path: `test-results/${name}-stable.png`,
    fullPage: false,
    animations: "disabled",
    caret: "hide",
  });
}
