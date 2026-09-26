import { test, expect } from '@playwright/test';

test('FAST starts with architecture, vocabulary and a thesis, then teaches the transform',async({page})=>{
 await page.goto('/paper/fast-action-tokenization');
 await expect(page.getByRole('button',{name:'Simplified paper',exact:true})).toBeVisible();
 await expect(page.getByRole('region',{name:'Visual paper overview'})).toBeVisible();
 await page.getByText('Vocabulary & deeper explanation',{exact:true}).click();
 await expect(page.getByRole('heading',{name:'The vocabulary you need'})).toBeVisible();
 await expect(page.getByRole('heading',{name:'The thesis',exact:true})).toBeVisible();
 await expect(page.getByText('Learning guide pending',{exact:true})).toHaveCount(0);
 await page.locator('.book-tabs button').nth(2).click();
 const slider=page.getByRole('slider',{name:'Cosine components retained'});
 await expect(slider).toBeVisible();
 await slider.fill('32');
 await expect(page.locator('.fast-signal')).toContainText('0.000');
 await slider.fill('3');
 await expect(page.locator('.fast-signal')).toContainText('correction is missing');
 await page.reload();
 await expect(page.locator('.book-tabs button').nth(2)).toHaveAttribute('aria-current','step');
 await page.getByRole('button',{name:'Original paper',exact:true}).click();
 await expect(page.locator('iframe')).toHaveAttribute('src','https://arxiv.org/pdf/2501.09747v1#view=FitH');
});
test('another added reading has a complete chapter structure and a PDF link',async({page})=>{
 await page.goto('/paper/clip-visual-language-pretraining');
 await expect(page.locator('.book-tabs button')).toHaveCount(5);
 await expect(page.locator('.library-teaching-visual')).toBeVisible();
 await page.locator('.book-tabs button').last().click();
 await expect(page.locator('.library-understanding summary')).toBeVisible();
 await page.getByRole('button',{name:'Original paper',exact:true}).click();
 await expect(page.locator('iframe')).toHaveAttribute('src','https://arxiv.org/pdf/2103.00020#view=FitH');
});
test('opening architecture fits mobile',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/paper/fast-action-tokenization');
 await page.addStyleTag({content:'html { scroll-behavior:auto!important; }'});
 await page.getByRole('region',{name:'Visual paper overview'}).scrollIntoViewIfNeeded();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 await page.screenshot({path:'/tmp/physical-ai-fast-mobile.png'});
});

test('notes made on the old FAST overview still resolve after upgrading to a guide',async({page})=>{
 const {readFileSync}=await import('node:fs');
 const paper=JSON.parse(readFileSync('lib/curation/reading-papers.json','utf8')).find((item:{slug:string})=>item.slug==='fast-action-tokenization');
 const now=new Date().toISOString();
 const record={paper,saved:true,status:'reading',chapter:0,mode:'guide',learned:'',questions:'',nextSteps:'',lastOpenedAt:now,completedAt:null,updatedAt:now,annotations:[{id:'legacy-fast',chapter:0,surface:'overview',start:0,end:paper.summary.length,quote:paper.summary,prefix:'',suffix:'',note:'My existing note',createdAt:now,updatedAt:now}]};
 await page.addInitScript(({slug,record})=>localStorage.setItem('reading-library:v1',JSON.stringify({version:1,records:{[slug]:record}})),{slug:paper.slug,record});
 await page.goto('/paper/fast-action-tokenization');
 await expect(page.getByLabel('Your note',{exact:true})).toHaveValue('My existing note');
 await page.getByRole('button',{name:/Jump to passage/}).click();
 await expect(page.locator('.legacy-overview-notes')).toHaveAttribute('open','');
 await expect(page.locator('[data-highlight-id="legacy-fast"]').first()).toBeVisible();
});
