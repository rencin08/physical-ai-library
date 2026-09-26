import { test, expect } from '@playwright/test';
test('DROID opens on original figures with empty notes closed and text optional',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});
 await page.goto('/paper/droid-robot-manipulation-dataset');
 await page.addStyleTag({content:'html{scroll-behavior:auto!important}'});
 const intro=page.getByRole('region',{name:'Visual paper overview'});
 await expect(intro).toBeVisible();
 await expect(page.getByRole('complementary',{name:'Margin notes'})).toBeHidden();
 await expect(page.locator('.visual-reading-details')).not.toHaveAttribute('open','');
 const figure=intro.locator('img');
 await expect(figure).toHaveAttribute('src','/paper-figures/droid/setup.png');
 await expect.poll(()=>figure.evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);
 await intro.scrollIntoViewIfNeeded();
 await page.screenshot({path:'/tmp/droid-visual-desktop.png'});
 await intro.getByRole('button',{name:/Diversify/}).click();
 await expect(figure).toHaveAttribute('src','/paper-figures/droid/scenes.png');
 await expect(intro).toContainText('564 scenes');
 await intro.getByRole('button',{name:/Test/}).click();
 await expect(figure).toHaveAttribute('src','/paper-figures/droid/evaluation.png');
 await expect(intro).toContainText('Six tasks used to test policy learning');
 await intro.getByRole('button',{name:'Explore the method'}).click();
 await expect(page.locator('.book-tabs button').nth(1)).toHaveAttribute('aria-current','step');
});
test('FAST uses its real pipeline and both figure readers fit a phone',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 for(const slug of ['fast-action-tokenization','droid-robot-manipulation-dataset']){
  await page.goto(`/paper/${slug}`);
  await page.addStyleTag({content:'html{scroll-behavior:auto!important}'});
  const intro=page.getByRole('region',{name:'Visual paper overview'});
  await expect.poll(()=>intro.locator('img').evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await intro.scrollIntoViewIfNeeded();
  await page.screenshot({path:`/tmp/${slug}-visual-mobile.png`});
 }
});

test('DROID later chapters show original figures, preserve text, and restore the chapter', async ({page}) => {
 await page.setViewportSize({width:1440,height:1000});
 await page.goto('/paper/droid-robot-manipulation-dataset');
 await page.addStyleTag({content:'html{scroll-behavior:auto!important}'});
 const seenImages = new Set(['/paper-figures/droid/setup.png','/paper-figures/droid/scenes.png','/paper-figures/droid/evaluation.png']);
 for (const chapter of [1,2,3,4]) {
  await page.locator('.book-tabs button').nth(chapter).click();
  const visual=page.locator('.visual-chapter');
  await expect(visual).toBeVisible();
  await expect(page.locator('.visual-reading-details')).not.toHaveAttribute('open','');
  for (const button of await visual.locator('.figure-sequence button').all()) {
   await button.click();
   if (await visual.locator('img').count()) {
    await expect.poll(()=>visual.locator('img').evaluate((img:HTMLImageElement)=>img.complete && img.naturalWidth>0)).toBe(true);
    const src=(await visual.locator('img').getAttribute('src'))!;
    expect(seenImages.has(src)).toBe(false);
    seenImages.add(src);
   } else {
    await expect(visual.locator('[data-teaching-visual]')).toBeVisible();
   }
  }
  if (chapter === 1 || chapter === 2) await visual.screenshot({path:`/tmp/droid-chapter-${chapter}-desktop.png`});
  await page.locator('.visual-reading-details > summary').click();
  await expect(page.locator('[data-annotation-surface="left"]')).toBeVisible();
  await page.locator('.visual-reading-details > summary').click();
 }
 await page.reload();
 await expect(page.locator('.book-tabs button').nth(4)).toHaveAttribute('aria-current','step');
 await expect(page.locator('.visual-chapter')).toBeVisible();
 await page.setViewportSize({width:390,height:844});
 for (const chapter of [1,2,3,4]) {
  await page.locator('.book-tabs button').nth(chapter).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  if (chapter === 2) await page.locator('.visual-chapter').screenshot({path:'/tmp/droid-training-mobile.png'});
 }
 await page.locator('.visual-chapter footer button').click();
 await expect(page.getByRole('region',{name:'Visual paper overview'})).toBeVisible();
});


test('DROID training explains batch composition and replanning with distinct interactive visuals',async({page})=>{
 await page.goto('/paper/droid-robot-manipulation-dataset');
 await page.locator('.book-tabs button').nth(2).click();
 const visual=page.locator('.visual-chapter');
 await expect(visual.locator('.batch-grid .other')).toHaveCount(64);
 await visual.getByRole('button',{name:'Task only',exact:true}).click();
 await expect(visual.locator('.batch-grid .task')).toHaveCount(128);
 await expect(visual.locator('.batch-grid .other')).toHaveCount(0);
 await visual.getByRole('button',{name:'Task + Open-X',exact:true}).click();
 await expect(visual.locator('.batch-grid')).toHaveAttribute('aria-label','Batch of 128: 64 target-task samples and 64 Open-X samples');
 await visual.screenshot({path:'/tmp/droid-batch-desktop.png'});
 await visual.getByRole('button',{name:/Predict & act/}).click();
 await expect(visual.locator('.action-timeline .execute')).toHaveCount(8);
 await visual.getByRole('button',{name:/Advance 8 actions/}).click();
 await expect(visual.locator('.action-timeline span').first()).toHaveText('9');
 await expect(visual.locator('.action-cycle')).toContainText('observe again');
 await visual.screenshot({path:'/tmp/droid-actions-desktop.png'});
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 await visual.screenshot({path:'/tmp/droid-actions-mobile.png'});
});


test('reviewed Sol guide explains GUI panels and exposes sourced chapter detail',async({page})=>{
 await page.goto('/paper/droid-robot-manipulation-dataset');
 const intro=page.getByRole('region',{name:'Visual paper overview'});
 await expect(intro).toContainText('Can a large, varied collection');
 await page.locator('.book-tabs button').nth(1).click();
 const visual=page.locator('.visual-chapter');
 await expect(visual.locator('.figure-panel-notes dt')).toHaveCount(4);
 await expect(visual).toContainText('Three panels are mostly gray');
 await visual.locator('.reviewed-chapter-explanation > summary').click();
 await expect(visual.locator('.reviewed-explanation-body')).toContainText('randomly requested a task');
 await visual.screenshot({path:'/tmp/droid-sol-method-desktop.png'});
 await page.locator('.book-tabs button').nth(4).click();
 await visual.locator('.reviewed-chapter-explanation > summary').click();
 await visual.locator('.paper-source-uncertainties summary').click();
 await expect(visual.locator('.paper-source-uncertainties')).toContainText('does not clearly reconcile');
});
