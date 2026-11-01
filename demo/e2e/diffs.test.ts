import { expect, test } from '@playwright/test';

test('diffs demo renders added and removed lines', async ({ page }) => {
  await page.goto('/diffs');

  // Upstream renders into open shadow roots; Playwright CSS locators pierce them.
  const diff = page.getByTestId('file-diff');
  await expect(diff.locator('[data-line][data-line-type="change-addition"]').first()).toContainText('return `Hello, ${name}!`;');
  await expect(diff.locator('[data-line][data-line-type="change-deletion"]').first()).toContainText("return 'Hello, ' + name;");

  const file = page.getByTestId('file');
  await expect(file.locator('[data-line]').first()).toContainText('# diffs-svelte');
});
