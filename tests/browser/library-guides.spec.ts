import {test,expect} from '@playwright/test';
import guides from '../../lib/learning/reviewed/library-guides.json';

test('EgoVerse has five distinct source-linked chapters and persistent reading position',async({page})=>{
 await page.goto('/paper/egoverse-human-data-robot-learning');
 await expect(page.getByRole('button',{name:'Simplified paper',exact:true})).toBeVisible();
 await expect(page.locator('.overview-status')).toHaveCount(0);
 const diagrams=new Set<string>();
 for(let chapter=0;chapter<5;chapter++){
  await page.locator('.book-tabs button').nth(chapter).click();
  await expect(page.locator('.library-chapter')).toBeVisible();
  const tabsBox=await page.locator('.book-tabs').boundingBox();
  const navBox=await page.getByRole('navigation').boundingBox();
  expect(tabsBox!.y).toBeGreaterThanOrEqual(navBox!.y+navBox!.height);
  if(!await page.locator('.supplementary-teaching').getAttribute('open').then(value=>value!==null)) await page.locator('.supplementary-teaching > summary').click();
  const title=await page.locator('.library-teaching-visual figcaption').innerText();diagrams.add(title);
  const nodes=page.locator('.library-visual-nodes button');
  await nodes.nth(1).click();await expect(nodes.nth(1)).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('.library-visual-detail h3')).toHaveText(await nodes.nth(1).locator('strong').innerText());
  await expect(page.locator('.library-page-sources a').first()).toHaveAttribute('href',/https:.*#page=\d+/);
 }
 expect(diagrams.size).toBe(5);
 await page.reload();await expect(page.locator('.book-tabs button').nth(4)).toHaveAttribute('aria-current','step');
 await page.locator('.book-tabs button').first().click();
 await page.locator('.book-tabs').scrollIntoViewIfNeeded();
 await expect(page.locator('.library-chapter-footer')).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
 await expect(page.locator('.library-key-point')).toHaveCSS('position','static');
 await page.screenshot({path:'/tmp/egoverse-simplified-desktop.png',fullPage:true});
 await page.screenshot({path:'/tmp/egoverse-simplified-viewport.png'});
});

test('a survey teaches synthesis instead of claiming to train a model, including on mobile',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/paper/unified-robot-learning-survey-2026');
 await page.locator('.book-tabs button').nth(2).click();
 await expect(page.locator('.library-chapter header .book-kicker')).toContainText('survey');
 await expect(page.locator('.library-chapter')).toBeVisible();
 await expect(page.locator('.overview-status')).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();
 await page.locator('.library-chapter h2').scrollIntoViewIfNeeded();
 await page.screenshot({path:'/tmp/simplified-survey-mobile.png',fullPage:true});
 await page.screenshot({path:'/tmp/simplified-survey-mobile-viewport.png'});
});

test('every expanded paper serves the simplified reader, not a pending overview',async({request})=>{
 for(const slug of Object.keys(guides)){
  const response=await request.get(`/paper/${slug}`);expect(response.ok(),slug).toBeTruthy();
  const html=await response.text();expect(html,slug).toContain('Simplified paper');
  expect(html,slug).not.toContain('Learning guide pending');
 }
});


test('new visible explanations support saved highlights after reload',async({page})=>{
 await page.goto('/paper/egoverse-human-data-robot-learning');
 const paragraph=page.locator('[data-annotation-surface="visual"] > p').first();
 await paragraph.scrollIntoViewIfNeeded();
 const quote=await paragraph.evaluate(element=>{
  const range=document.createRange();range.selectNodeContents(element);
  const selection=window.getSelection()!;selection.removeAllRanges();selection.addRange(range);
  document.dispatchEvent(new Event('selectionchange'));return range.toString();
 });
 await page.getByRole('button',{name:'Highlight',exact:true}).click();
 await expect(page.locator('.annotation-card blockquote')).toHaveText(quote);
 await page.reload();
 await expect(page.locator('.annotation-card blockquote')).toHaveText(quote);
 await expect(page.locator('[data-highlight-id]').first()).toBeVisible();
});
