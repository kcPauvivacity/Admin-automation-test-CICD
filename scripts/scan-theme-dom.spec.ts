import { test } from '@playwright/test';
import { loginToApp } from '../tests/helpers/auth.helper';

test('scan theme DOM', async ({ page }) => {
  test.setTimeout(120000);
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
      return (p as HTMLElement)?.outerHTML?.slice(0, 3000) || '';
    });
  });
  
  console.log('=== Theme section HTML ===');
  html.forEach((h, i) => console.log(`[${i}]\n${h}\n---`));

  // Also check what buttons are near the theme text
  const buttons = await page.evaluate(() => {
    const allBtns = Array.from(document.querySelectorAll('button, [role="button"]'));
    return allBtns.slice(0, 30).map(b => ({
      text: b.textContent?.trim().slice(0, 50),
      ariaLabel: b.getAttribute('aria-label'),
      class: b.className?.slice(0, 100)
    }));
  });
  console.log('=== All buttons (first 30) ===');
  buttons.forEach((b, i) => console.log(`[${i}] text="${b.text}" aria="${b.ariaLabel}" class="${b.class}"`));
});
