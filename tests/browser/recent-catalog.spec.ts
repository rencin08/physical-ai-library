import {test,expect} from '@playwright/test';

test('2026 papers are on the bookshelf and in Robot Data and World Models',async({page})=>{
 await page.goto('/');
 await expect(page.locator('.shelf-book b').filter({hasText:'2026'})).toHaveCount(2);
 await page.getByRole('button',{name:'All papers',exact:true}).click();
 await expect(page.locator('.shelf-book')).toHaveCount(41);
 await expect(page.getByLabel('Shelf order')).toHaveValue('newest');
 await expect(page.locator('.shelf-book').first()).toContainText('2026');
 await page.locator('#topics').getByRole('button',{name:'Robot Data',exact:true}).click();
 await expect(page.locator('.shelf-book').filter({hasText:'EgoVerse'})).toHaveCount(1);
 await expect(page.locator('.shelf-book').filter({hasText:'π₀.₇'})).toHaveCount(1);
 await expect(page.locator('.shelf-book').first()).toContainText('From Foundation to Application');
 await page.screenshot({path:'/tmp/recent-robot-data-shelf.png',fullPage:true});
 await page.locator('#topics').getByRole('button',{name:'World Models',exact:true}).click();
 await expect(page.locator('.shelf-book').filter({hasText:'OA-WAM'})).toHaveCount(1);
 await expect(page.locator('.shelf-book').filter({hasText:'World-Action Models for Robot'})).toHaveCount(1);
});

test('author-hosted reports open and stay readable after saving',async({page})=>{
 await page.goto('/paper/pi-07-steerable-generalist');
 await expect(page.getByRole('heading',{level:1})).toContainText('π₀.₇');
 await expect(page.getByRole('link',{name:'Authors’ research page'})).toHaveAttribute('href','https://www.pi.website/blog/pi07');
 await expect(page.locator('.overview-status')).toHaveCount(0);
 await expect(page.locator('.book-tabs button')).toHaveCount(5);
 await page.getByRole('button',{name:/^Save paper:/}).first().click();
 await page.getByRole('button',{name:'Original paper',exact:true}).click();
 await expect(page.locator('iframe')).toHaveAttribute('src',/^https:\/\/www.pi.website\/download\/pi07.pdf/);
 await page.goto('/saved');
 await expect(page.locator('.saved-record').filter({hasText:'π₀.₇'})).toBeVisible();
 await page.locator('.saved-record').filter({hasText:'π₀.₇'}).getByRole('link',{name:/Return to paper|Start reading/}).click();
 await expect(page).toHaveURL(/\/paper\/pi-07-steerable-generalist$/);
 await page.goto('/paper/egoverse-human-data-robot-learning');
 await expect(page.getByRole('link',{name:'View on arXiv'})).toHaveAttribute('href','https://arxiv.org/abs/2604.07607');
});

test('every author-hosted original uses its report URL, including after reload', async ({page}) => {
 for (const [slug,file] of [['pi-07-steerable-generalist','pi07.pdf'],['mem-multi-scale-embodied-memory','Mem.pdf'],['rl-token-efficient-online-rl','rlt.pdf']]) {
  await page.goto(`/paper/${slug}`);
  await page.getByRole('button',{name:'Original paper',exact:true}).click();
  await expect(page.locator('.reader-bar')).toContainText('Authors’ original report');
  await expect(page.locator('iframe')).toHaveAttribute('src',`https://www.pi.website/download/${file}#view=FitH`);
  await page.reload();
  await expect(page.locator('iframe')).toHaveAttribute('src',`https://www.pi.website/download/${file}#view=FitH`);
  await expect(page.getByRole('link',{name:'Open full screen'})).toHaveAttribute('href',`https://www.pi.website/download/${file}`);
 }
});
