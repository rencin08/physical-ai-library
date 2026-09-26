import {test,expect} from '@playwright/test';

test('unbundled figures have explicit explanations and source PDF links across five chapters',async({page})=>{
 await page.goto('/paper/pi-07-steerable-generalist',{waitUntil:'domcontentloaded'});
 for(let i=0;i<5;i++){
  await page.locator('.book-tabs button').nth(i).click();
  await expect(page.locator('.figure-fallback-reason')).toContainText('not bundled');
  await expect(page.locator('.original-paper-figure img')).toHaveCount(0);
  await expect(page.locator('.library-page-sources a').first()).toHaveAttribute('href',/https:.*#page=\d+/);
  await expect(page.locator('.library-teaching-visual')).toBeVisible();
 }
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();
});
