import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
const directory=process.env.LIBRARY_E2E_BACKUP_DIRECTORY;
test('optional folder backups are disabled by default',async({request})=>{
 test.skip(Boolean(directory),'Run without a backup directory to check default behavior.');
 expect(await (await request.get('/api/local-backup')).json()).toEqual({configured:false});
});
test('local folder copies are written and unsafe requests are rejected',async({page,request})=>{
 test.skip(!directory,'Run with a temporary LIBRARY_E2E_BACKUP_DIRECTORY.');
 await page.goto('/paper/diffusion-policy-visuomotor-policy-learning');
 await page.locator('.paper-buttons .save-paper').click();
 await page.goto('/saved');
 await expect(page.getByText('A copy is saved in your local backup folder.',{exact:true})).toBeVisible();
 const id=await page.evaluate(()=>localStorage.getItem('reading-library:backup-browser-id'));
 const latest=JSON.parse(await readFile(join(directory!,`reading-${id}.json`),'utf8'));
 expect(latest.records['diffusion-policy-visuomotor-policy-learning'].saved).toBe(true);
 const daily=JSON.parse(await readFile(join(directory!,`reading-${id}-${new Date().toISOString().slice(0,10)}.json`),'utf8'));
 expect(daily).toEqual(latest);
 const denied=await request.post('/api/local-backup',{headers:{Origin:'https://unrelated.example'},data:{browserId:id,state:latest}});
 expect(denied.status()).toBe(403);
 const invalid=await request.post('/api/local-backup',{headers:{Origin:'http://127.0.0.1:3100'},data:{browserId:'../../escape',state:latest}});
 expect(invalid.status()).toBe(400);
});
