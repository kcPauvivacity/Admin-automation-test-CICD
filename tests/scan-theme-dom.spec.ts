import { test } from '@playwright/test';
import { loginToApp } from './helpers/auth.helper';

test('click theme row in profile panel', async ({ page }) => {
  test.setTimeout(120000);
  await loginToApp(page);
  await page.goto('https://app-staging.vivacityapp.com/demo-student/settings/user-profile');
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(4000);

  // Click avatar 
  await page.locator('button[aria-label*="User profile menu"]').click();
  await page.waitForTimeout(1000);

  // Find the Theme row by clicking the chevron button next to "Theme / Current: Light Theme"
  // Use the aria-label "Open theme selector" but try scrolling/checking visibility
  const btns = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button, [role="button"]'))
      .map(b => ({
        aria: b.getAttribute('aria-label'),
        text: b.textContent?.trim().slice(0, 50),
        visible: (b as HTMLElement).offsetHeight > 0 && (b as HTMLElement).offsetWidth > 0,
        display: window.getComputedStyle(b).display,
        visibility: window.getComputedStyle(b).visibility,
        opacity: window.getComputedStyle(b).opacity
      }))
      .filter(b => b.aria?.includes('theme') || b.aria?.includes('Theme') || (b.text || '').includes('Theme'));
  });
  console.log('Theme buttons:', JSON.stringify(btns));
  
  // Try clicking the chevron using JS
  const clicked = await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label="Open theme selector"]') as HTMLElement;
    if (btn) { btn.click(); return `clicked Open theme selector, display=${window.getComputedStyle(btn).display}`; }
    const btn2 = document.querySelector('[class*="theme-info-button"]') as HTMLElement;
    if (btn2) { btn2.click(); return 'clicked theme-info-button'; }
    return 'nothing found';
  });
  console.log('Click result:', clicked);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/tmp/theme-after-js-click.png' });

  // Check if Container Option is now visible
  const hasContainer = await page.evaluate(() => 
    !!document.querySelector('*::-webkit-scrollbar') || 
    Array.from(document.querySelectorAll('*')).some(el => el.textContent?.trim() === 'Container Option')
  );
  console.log('Container Option found:', hasContainer);
});
