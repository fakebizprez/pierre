import { expect, test } from '@playwright/test';

test('home links to both demos', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'trees-svelte' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'diffs-svelte' })).toBeVisible();
});
