import { chromium } from '@playwright/test';
import { loginToApp } from '../tests/helpers/auth.helper';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await loginToApp(page);
  await page.goto('https://app-staging.vivacityapp.com/demo-student/settings/user-profile');
  await page.waitForLoadState('load');
  await page.waitForTimeout(3000);
  
  const html = await page.evaluate(() => {
    const themeEls = Array.from(document.querySelectorAll('*')).filter(el => 
      el.children.length === 0 && el.textContent?.trim() === 'Theme'
    );
    return themeEls.map(el => {
      let p: Element | null = el;
      for (let i = 0; i < 6; i++) if (p?.parentElement) p = p.parentElement;
      return p?.outerHTML?.slice(0, 3000) || '';
    });
  });
  
  console.log('=== Theme section HTML ===');
  html.forEach((h, i) => console.log(`[${i}]\n${h}\n---`));
  
  await browser.close();
})();
