import { chromium } from 'playwright';
import fs from 'fs';

(async ()=>{
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const routes = ['/leaderboard','/profile','/achievement','/notifications','/settings'];
  // viewports to test
  const viewports = [
    { name: 'desktop', width: 1280, height: 800 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile_375', width: 375, height: 812 },
    { name: 'mobile_390', width: 390, height: 844 }
  ];

  // ensure output dir
  fs.mkdirSync('screenshots/responsive', { recursive: true });

  // set hub flag first
  await page.goto('http://localhost:3001/');
  await page.evaluate(()=>{ localStorage.setItem('ngolab_force_hub','1'); });

  for(const r of routes){
    for(const v of viewports){
      await page.setViewportSize({ width: v.width, height: v.height });
      await page.goto('http://localhost:3001'+r, { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);
      const filename = `screenshots/responsive${r}_${v.name}.png`.replace(/\//g,'_');
      const buf = await page.screenshot({ fullPage: true });
      fs.writeFileSync(filename, buf);
      console.log('Saved', filename);
    }
  }

  await browser.close();
})();
