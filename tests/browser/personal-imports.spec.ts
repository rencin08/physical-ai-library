import {test,expect} from '@playwright/test';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import type {Paper} from '../../lib/data';
const fixture:Paper={slug:'arxiv-9901-54321',arxivId:'9901.54321',title:'Test Robotics Memory Paper',shortTitle:'Test Robotics Memory',authors:'Fixture Author',institution:'arXiv',year:2026,publishedAt:'2026-09-20T00:00:00Z',summary:'A fixture abstract about robot memory and manipulation.',why:'',topics:['Memory','Manipulation'],sourceUrl:'https://arxiv.org/abs/9901.54321v1',pdfUrl:'https://arxiv.org/pdf/9901.54321v1',accent:'teal',architecture:'',task:'',embodiments:'',modalities:'',dataset:'',openSource:false,contributions:[],limitations:[],lineage:[]};
const folder=resolve('test-results/library-personal');

test('paste import persists a new paper, opens its reader, and offers guide preparation',async({page,request})=>{
 await page.route('**/api/library/import',async route=>{
  if(route.request().postDataJSON().arxiv.includes('9901.54321')){
   await mkdir(folder,{recursive:true});await writeFile(`${folder}/imports.json`,JSON.stringify([fixture]));await route.fulfill({status:201,json:{paper:fixture,existing:false}});
  }else await route.continue();
 });
 await page.goto('/',{waitUntil:'load'});await page.getByRole('button',{name:'Add paper',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Add a paper'});await dialog.getByLabel('arXiv link or ID').fill(fixture.sourceUrl!);await dialog.getByRole('button',{name:'Add to library',exact:true}).click();
 await expect(dialog.getByRole('status')).toContainText(fixture.title);await dialog.getByRole('link',{name:'Open paper'}).click();
 await expect(page).toHaveURL(new RegExp(`/paper/${fixture.slug}$`),{timeout:20000});await expect(page.getByRole('heading',{name:fixture.title,exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Prepare illustrated guide'})).toBeVisible();await expect(page.locator('.imported-overview')).toContainText(fixture.summary);
 await page.reload({waitUntil:'domcontentloaded'});await expect(page.getByRole('heading',{name:fixture.title,exact:true})).toBeVisible();
 expect(await page.evaluate(slug=>JSON.parse(localStorage.getItem('reading-library:v1')!).records[slug].saved,fixture.slug)).toBeTruthy();
 const duplicate=await request.post('/api/library/import',{headers:{Origin:'http://127.0.0.1:3100'},data:{arxiv:'9901.54321v2'}});expect(duplicate.ok()).toBeTruthy();expect((await duplicate.json()).existing).toBeTruthy();
 await page.getByRole('button',{name:'Prepare illustrated guide'}).click();await expect(page.locator('.guide-preparation').getByRole('alert')).toContainText('disabled in this environment',{timeout:20000});
 await page.screenshot({path:'/tmp/library-imported-reader.png',fullPage:true});
});

test('arXiv search result has an add action and preserves useful failure feedback',async({page})=>{
 await page.route('**/api/arxiv/search?*',route=>route.fulfill({json:{papers:[{id:'9901.54322v1',title:'Search fixture paper',authors:['Author'],abstract:'Robot abstract.',published:'2026-09-22',url:'https://arxiv.org/abs/9901.54322v1',pdfUrl:'https://arxiv.org/pdf/9901.54322v1'}],total:1,start:0,nextStart:null}}));
 let failed=true;await page.route('**/api/library/import',route=>route.fulfill(failed?{status:400,json:{error:'arXiv is temporarily unavailable. Please try again.'}}:{json:{paper:fixture,existing:true}}));
 await page.goto('/',{waitUntil:'load'});await page.getByRole('button',{name:'Find more on arXiv'}).click();const dialog=page.getByRole('dialog',{name:'Search arXiv'});
 await dialog.getByRole('button',{name:'Add to library'}).click();await expect(dialog.getByRole('alert')).toContainText('temporarily unavailable');
 failed=false;await dialog.getByRole('button',{name:'Add to library'}).click();await expect(dialog.getByRole('link',{name:'Added · Open paper'})).toHaveAttribute('href',`/paper/${fixture.slug}`);
});

test('fresh discovery sends topic signals without notes, explains matches, and supports mobile imports',async({page})=>{
 await page.setViewportSize({width:390,height:844});let refreshBody:any;
 await page.addInitScript(p=>localStorage.setItem('reading-library:v1',JSON.stringify({version:1,records:{[p.slug]:{paper:p,saved:true,status:'completed',chapter:0,mode:'guide',learned:'SECRET PRIVATE NOTE',questions:'',nextSteps:'',lastOpenedAt:null,completedAt:'2026-09-20T00:00:00Z',updatedAt:'2026-09-20T00:00:00Z'}},preferences:{interests:['World Models'],feedback:{},useReadingHistory:true}})),fixture);
 await page.route('**/api/discovery',async route=>{
  if(route.request().method()==='GET'){await route.fulfill({json:{papers:[]}});return;}
  const body=route.request().postDataJSON();if(body.action==='profile'){await route.fulfill({json:{saved:true}});return;}
  refreshBody=body;await route.fulfill({json:{papers:[{id:'9901.11111',title:'Fresh memory research',authors:['Author'],abstract:'Robot memory and manipulation research abstract.',published:'2026-09-25',url:'https://arxiv.org/abs/9901.11111',pdfUrl:'https://arxiv.org/pdf/9901.11111',reason:'Because you finished Test Robotics Memory'}],updatedAt:'2026-09-25T00:00:00Z'}});
 });
 await page.goto('/',{waitUntil:'load'});await page.getByRole('button',{name:'Find new papers for me'}).click();await expect(page.getByRole('heading',{name:'Fresh memory research'})).toBeVisible();
 expect(refreshBody.profile.topics.some((t:any)=>t.topic==='Memory')).toBeTruthy();expect(refreshBody.profile.topics.some((t:any)=>t.topic==='World Models')).toBeTruthy();expect(JSON.stringify(refreshBody)).not.toContain('SECRET PRIVATE NOTE');
 await expect(page.locator('.fresh-papers')).toContainText('Because you finished Test Robotics Memory');await expect(page.locator('.fresh-papers').getByRole('button',{name:'Add to library'})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();await page.locator('.fresh-papers').scrollIntoViewIfNeeded();await page.screenshot({path:'/tmp/library-fresh-papers-mobile.png'});
});

test('local mutations reject third-party origins and do not fetch arbitrary URLs',async({request})=>{
 const badOrigin=await request.post('/api/library/import',{headers:{Origin:'https://unrelated.example'},data:{arxiv:'2403.12945'}});expect(badOrigin.status()).toBe(403);
 const badUrl=await request.post('/api/library/import',{headers:{Origin:'http://127.0.0.1:3100'},data:{arxiv:'http://127.0.0.1:3100/private'}});expect(badUrl.status()).toBe(400);
 const discovery=await request.post('/api/discovery',{headers:{Origin:'https://unrelated.example'},data:{action:'refresh',profile:{topics:[],excludedIds:[]}}});expect(discovery.status()).toBe(403);
});

test('guide progress and review link survive reader reloads without auto-generation',async({page})=>{
 await mkdir(folder,{recursive:true});await writeFile(`${folder}/imports.json`,JSON.stringify([fixture]));let state='preparing';let calls=0;
 await page.route(`**/api/guides/${fixture.slug}`,route=>{if(route.request().method()==='POST')calls++;return route.fulfill({json:{state,message:state==='preparing'?'Extracting original figures.':'Your illustrated draft is ready.'}});});
 await page.goto(`/paper/${fixture.slug}`,{waitUntil:'domcontentloaded'});await expect(page.getByRole('heading',{name:'Preparing your illustrated guide…'})).toBeVisible();expect(calls).toBe(0);
 state='needs_review';await page.reload({waitUntil:'domcontentloaded'});await expect(page.getByRole('link',{name:'Review illustrated draft'})).toHaveAttribute('href',`/guides/${fixture.slug}/review`);expect(calls).toBe(0);
});
