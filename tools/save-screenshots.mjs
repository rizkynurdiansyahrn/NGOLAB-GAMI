import { chromium } from 'playwright';
import fs from 'fs';

(async ()=>{
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const routes = ['/leaderboard','/profile','/achievement','/notifications','/settings'];
  await page.goto('http://localhost:3001/');
  // Ensure hub open flag
  await page.evaluate(()=>{ localStorage.setItem('ngolab_force_hub','1'); });

  for(const r of routes){
    await page.goto('http://localhost:3001'+r);
    await page.waitForTimeout(500);
    const buf = await page.screenshot({ fullPage: true });
    const filePath = `public/thumbnails/screenshots${r.replace(/\//g,'_')}.png`.replace('_','');
    fs.mkdirSync('public/thumbnails/screenshots', { recursive:true });
    fs.writeFileSync(`public/thumbnails/screenshots${r}.png`, buf);
    console.log('Saved', `public/thumbnails/screenshots${r}.png`);
  }

  await browser.close();
})();
