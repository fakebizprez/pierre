import { expect, test } from '@playwright/test';

test('trees demo renders rows, reports selection and searches', async ({ page }) => {
  await page.goto('/trees');

  // Rows live in the tree's open shadow root; Playwright locators pierce it.
  const readme = page.getByRole('treeitem', { name: 'README.md' });
  await expect(readme).toBeVisible();

  await readme.click();
  await expect(page.getByTestId('selected-paths')).toHaveText('README.md');

  await page.getByRole('searchbox', { name: 'Filter files' }).fill('button');
  await expect(page.getByRole('treeitem', { name: 'Button.svelte' })).toBeVisible();
  await expect(page.getByTestId('match-count')).toHaveText('1 match');
});
