import { test, expect, type Page } from '@playwright/test';
const path='/paper/diffusion-policy-visuomotor-policy-learning';
async function selectPassage(page:Page) {
 const paragraph=page.locator('[data-annotation-surface="left"] .learning-page > p').first();
 if (!(await paragraph.isVisible())) await page.getByText("Read chapter text & saved passages",{exact:true}).click();
 await paragraph.scrollIntoViewIfNeeded();
 return paragraph.evaluate(element=>{
  const range=document.createRange();
  range.selectNodeContents(element);
  const selection=window.getSelection()!;
  selection.removeAllRanges();selection.addRange(range);
  document.dispatchEvent(new Event('selectionchange'));
  return range.toString();
 });
}
test('select, annotate, restore, jump across chapters, and delete',async({page})=>{
 await page.goto(path);
 await expect(page.locator('.paper-buttons .save-paper')).toBeEnabled();
 await expect(page.locator('.paper-reflection')).not.toHaveAttribute('open','');
 const quote=await selectPassage(page);
 await page.getByRole('button',{name:'Add note',exact:true}).click();
 const note=page.getByLabel('Your note',{exact:true});
 await expect(note).toBeFocused();
 await note.fill('This connects to receding-horizon control.');
 await expect(page.locator('.annotation-card blockquote')).toHaveText(quote);
 await expect(page.locator('[data-highlight-id]').first()).toBeVisible();
 await page.reload();
 await expect(note).toHaveValue('This connects to receding-horizon control.');
 await expect(page.locator('[data-highlight-id]').first()).toBeVisible();
 await page.locator('.book-tabs button').nth(2).click();
 await expect(page.locator('[data-highlight-id]')).toHaveCount(0);
 await page.getByRole('button',{name:/Foundations · Jump to passage/}).click();
 await expect(page.locator('.book-tabs button').first()).toHaveAttribute('aria-current','step');
 await expect(page.locator('[data-highlight-id]').first()).toBeVisible();
 // Clicking a painted passage reopens its note panel.
 await page.getByRole('button',{name:'Close margin notes'}).click();
 // Closing the notes changes column widths; bring the passage back into view.
 await page.locator('[data-highlight-id]').first().scrollIntoViewIfNeeded();
 const bounds=await page.locator('[data-highlight-id]').first().boundingBox();
 await page.mouse.click(bounds!.x+5,bounds!.y+bounds!.height/2);
 await expect(page.getByRole('complementary',{name:'Margin notes'})).toBeVisible();
 await page.getByRole('button',{name:'Delete annotation',exact:true}).click();
 await page.getByRole('button',{name:'Remove',exact:true}).click();
 await expect(page.locator('.annotation-card')).toHaveCount(0);
 await expect(page.locator('[data-highlight-id]')).toHaveCount(0);
});
test('highlights export/import and appear in the saved learning notes',async({page})=>{
 await page.goto(path);
 await expect(page.locator('.paper-buttons .save-paper')).toBeEnabled();
 const quote=await selectPassage(page);
 await page.getByRole('button',{name:'Highlight',exact:true}).click();
 await page.goto('/saved');
 await page.getByRole('tab',{name:'Learning notes',exact:true}).click();
 await expect(page.locator('.saved-notes')).toContainText(quote);
 const downloadPromise=page.waitForEvent('download');
 await page.getByRole('button',{name:'Export backup'}).click();
 const file=await (await downloadPromise).path();
 await page.evaluate(()=>localStorage.removeItem('reading-library:v1'));
 await page.reload();
 await page.getByLabel('Import library backup').setInputFiles(file!);
 await page.goto(path);
 await expect(page.locator('.annotation-card blockquote')).toHaveText(quote);
 await expect(page.locator('[data-highlight-id]').first()).toBeVisible();
});
test('a failed annotation save preserves the draft; mobile layout stays within the screen',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto(path);
 await expect(page.locator('.paper-buttons .save-paper')).toBeEnabled();
 await selectPassage(page);
 await page.getByRole('button',{name:'Add note',exact:true}).click();
 await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new DOMException('Full','QuotaExceededError');};});
 await page.getByLabel('Your note',{exact:true}).fill('Keep this unsaved thought.');
 await expect(page.getByLabel('Your note',{exact:true})).toHaveValue('Keep this unsaved thought.');
 await expect(page.locator('.annotation-card')).toContainText('Not saved.');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);
});
