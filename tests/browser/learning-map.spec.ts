import { test, expect } from '@playwright/test';
test('new visitor gets a short starting shelf, all papers, and real citation sorting', async ({ page }) => {
 await page.goto('/');
 await page.addStyleTag({content:'html { scroll-behavior: auto !important; }'});
 await expect(page.locator('.shelf-book')).toHaveCount(6);
 await expect(page.locator('.shelf-book').first()).toHaveAttribute('href','/paper/general-purpose-robots-survey');
 await page.getByRole('button',{name:'All papers',exact:true}).click();
 await expect(page.locator('.shelf-book')).toHaveCount(41);
 await page.getByLabel('Shelf order').selectOption('cited');
 await expect(page.locator('.shelf-book').first()).toHaveAttribute('href','/paper/clip-visual-language-pretraining');
 await page.locator('.shelf-book').first().hover();
 await expect(page.locator('.preview-citations')).toContainText('Semantic Scholar');
 await expect(page.locator('.preview-citations')).toContainText('Retrieved');
 await expect.poll(async () => {const box=await page.locator('.shelf-preview').boundingBox();return box!.y+box!.height;}).toBeLessThanOrEqual(720);
 await page.screenshot({path:'/tmp/physical-ai-discovery-desktop.png'});
});
test('the simple shelf and topic filters fit a phone', async ({ page }) => {
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 await page.getByRole('button',{name:'All papers',exact:true}).click();
 await page.locator('#topics').getByRole('button',{name:'World Models',exact:true}).click();
 await expect(page.locator('.shelf-book').first()).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 await expect(page.getByRole('navigation',{name:'Learning categories'})).toHaveCount(0);
 await page.screenshot({path:'/tmp/physical-ai-simple-mobile.png',fullPage:true});
});

test('welcome links to the restored roadmap with ordered readings and source categories', async ({page}) => {
 await page.goto('/');
 await page.getByRole('link',{name:'Learning roadmap',exact:true}).click();
 await expect(page).toHaveURL(/\/roadmap$/);
 await expect(page.getByRole('heading',{level:1,name:'How did the field get here?'})).toBeVisible();
 const categories=page.getByRole('navigation',{name:'Learning categories'});
 await categories.getByRole('button',{name:'Action Representation'}).click();
 const path=page.getByRole('region',{name:'Action Representation'});
 await expect(path.getByRole('link',{name:'ACT / ALOHA'})).toBeVisible();
 await path.getByRole('link',{name:'ACT / ALOHA'}).click();
 await expect(page).toHaveURL(/\/paper\/act-low-cost-bimanual-manipulation$/);
 await page.goto('/roadmap');
 await categories.getByRole('button',{name:'Safety & Alignment'}).click();
 await expect(page.getByRole('region',{name:'Safety & Alignment'})).toContainText('No local selections yet');
 await expect(page.getByRole('link',{name:'More in this category'})).toHaveAttribute('href',/awesome-physical-ai#safety--alignment$/);
 await page.getByRole('link',{name:'Back to your bookshelf'}).click();
 await expect(page).toHaveURL('/');
});

test('restored roadmap categories work on mobile', async ({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/roadmap');
 await page.getByRole('navigation',{name:'Learning categories'}).getByRole('button',{name:'World Models'}).click();
 await expect(page.getByRole('region',{name:'World Models'})).toContainText('DreamerV3');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 await page.screenshot({path:'/tmp/restored-roadmap-mobile.png',fullPage:true});
});


test('roadmap is chronological by default and includes current catalog developments',async({page})=>{
 await page.goto('/roadmap');
 const dates=await page.locator('.learning-path li').evaluateAll(items=>items.map(item=>item.getAttribute('data-date')!));
 expect(dates).toEqual([...dates].sort());
 await expect(page.locator('.learning-path li[data-year="2026"]')).not.toHaveCount(0);
 await expect(page.getByRole('link',{name:'π₀.₇',exact:true})).toBeVisible();
 await page.getByLabel('Roadmap order').selectOption('suggested');
 await expect(page.locator('.learning-path li').first()).toContainText('General-purpose robots');
 const categories=page.getByRole('navigation',{name:'Learning categories'});
 await categories.getByRole('button',{name:'World Models',exact:true}).click();
 await page.getByLabel('Roadmap order').selectOption('newest');
 await expect(page.locator('.learning-path li').first()).toHaveAttribute('data-year','2026');
 await expect(page.getByRole('link',{name:'DreamZero',exact:true})).toBeVisible();
 await expect(page.getByRole('link',{name:'Cosmos Policy',exact:true})).toBeVisible();
 await expect(page.getByRole('link',{name:'V-JEPA 2.1',exact:true})).toBeVisible();
 await page.screenshot({path:'/tmp/roadmap-chronology-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:'/tmp/roadmap-chronology-mobile.png',fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
