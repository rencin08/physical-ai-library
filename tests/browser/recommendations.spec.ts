import { test, expect } from '@playwright/test';

test('interests personalize the shelf, persist, and reset without deleting bookmarks', async ({ page }) => {
 await page.goto('/');
 await page.locator('.choose-interests').click();
 await page.getByRole('region',{name:'Your interests'}).getByRole('button',{name:'World Models',exact:true}).click();
 await page.locator('.shelf-book').first().hover();
 await expect(page.locator('.recommendation-reason')).toContainText('interest in World Models');
 await page.locator('.book-tooltip .save-paper').click();
 await page.getByRole('button',{name:'Done',exact:true}).click();
 await page.reload();
 await page.locator('.shelf-book').first().hover();
 await expect(page.locator('.recommendation-reason')).toContainText('interest in World Models');
 await page.locator('.choose-interests').click();
 await page.getByRole('button',{name:'Reset preferences',exact:true}).click();
 await expect(page.getByRole('checkbox',{name:'Use my bookmarks and finished papers'})).not.toBeChecked();
 await page.goto('/saved');
 await expect(page.locator('.saved-record')).toHaveCount(1);
});

test('feedback hides a paper only from For you and can be undone in All papers', async ({ page }) => {
 await page.goto('/');
 await page.keyboard.press('Tab');
 const original=page.locator('.shelf-book').first();
 const first=await original.getAttribute('href');
 await original.focus();
 await page.keyboard.press('ArrowDown');
 const more=page.getByRole('button',{name:'More like this',exact:true});
 await more.focus(); await more.press('Enter');
 await expect(more).toHaveAttribute('aria-pressed','true');
 const hide=page.getByRole('button',{name:'Not interested',exact:true});
 await hide.focus(); await hide.press('Enter');
 await expect(page.locator(`.shelf-book[href="${first}"]`)).toHaveCount(0);
 await page.reload();
 await expect(page.locator(`.shelf-book[href="${first}"]`)).toHaveCount(0);
 await page.getByRole('button',{name:'All papers',exact:true}).click();
 await page.keyboard.press('Tab');
 const restored=page.locator(`.shelf-book[href="${first}"]`);
 await restored.focus();
 await page.keyboard.press('ArrowDown');
 const restore=page.getByRole('button',{name:'Restore to For you',exact:true});
 await restore.focus(); await restore.press('Enter');
 await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'For you',exact:true}).click();
 await expect(restored).toBeVisible();
});
