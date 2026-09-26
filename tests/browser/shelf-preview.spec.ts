import { test, expect } from '@playwright/test';

test('hover preview stays near the book, accepts actions, and opens the reader', async ({ page }) => {
  await page.goto('/');
  const book = page.locator('.shelf-book').first();
  const preview = page.getByRole('region', { name: /^Preview:/ });
  await expect(preview).toHaveCount(0);
  const before = await page.locator('#library-search').boundingBox();
  await book.hover();
  await expect(preview).toBeVisible();
  const after = await page.locator('#library-search').boundingBox();
  expect(after?.y).toBe(before?.y);
  await preview.hover();
  await expect(preview).toBeVisible();
  await expect(preview.locator('.preview-summary')).not.toBeEmpty();
  await page.keyboard.press('Escape');
  await expect(preview).toHaveCount(0);
  await page.mouse.move(10, 10);
  await book.hover();
  const href = await book.getAttribute('href');
  await preview.getByRole('link', { name: 'Open book', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
});

test('keyboard can enter and dismiss the preview', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await page.locator('.shelf-book').first().focus();
  const preview = page.getByRole('region', { name: /^Preview:/ });
  await expect(preview).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await expect(preview.getByRole('button', { name: 'Close preview' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(preview).toHaveCount(0);
  await expect(page.locator('.shelf-book').first()).toBeFocused();
});

test('touch opens a preview before navigating and allows dismissal', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:3100/');
  const book = page.locator('.shelf-book').first();
  const href = await book.getAttribute('href');
  await book.tap();
  const preview = page.getByRole('region', { name: /^Preview:/ });
  await expect(preview).toBeVisible();
  await expect(page).toHaveURL('http://127.0.0.1:3100/');
  const box = await preview.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  await preview.getByRole('button', { name: 'Close preview' }).tap();
  await expect(preview).toHaveCount(0);
  await book.tap();
  await preview.getByRole('link', { name: 'Open book', exact: true }).tap();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await context.close();
});

test('the simplified homepage searches the shelf without a second catalog', async ({ page }) => {
  await page.goto('/?q=DROID');
  await expect(page.locator('.shelf-book')).toHaveCount(1);
  await expect(page.locator('.shelf-book')).toContainText('DROID');
  await expect(page.getByRole('heading', { name: 'Find your next read' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Clear search' }).click();
  await expect(page.locator('.shelf-book')).toHaveCount(41);
  await page.getByRole('textbox', { name: 'Find a paper' }).fill('no-such-paper-zzzz');
  await page.getByRole('textbox', { name: 'Find a paper' }).press('Enter');
  await expect(page.locator('.shelf-book')).toHaveCount(0);
  await page.getByRole('button', { name: 'Show all papers' }).click();
  await expect(page.locator('.shelf-book')).toHaveCount(41);
  await page.getByRole('link', { name: 'Saved papers', exact: true }).click();
  await expect(page).toHaveURL(/\/saved$/);
});
