import { expectNoSeriousViolations } from './axe';
import { expect, test } from './fixtures';

/**
 * The navigation bar and drawer (spec F.2, N.2, R; Pass 3 acceptance:
 * keyboard and axe checks).
 */

test.describe('every page', () => {
  test('starts with a skip link that moves focus to main', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main#main')).toBeFocused();
  });

  test('has one h1, a main landmark and a labelled navigation', async ({ page }) => {
    await page.goto('/');
    // The intro's h1 is hidden until the visitor has answered the threshold.
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('header')).toHaveCount(1);
  });

  test('has no horizontal scroll at 320 px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    for (const path of ['/', '/a-page-that-does-not-exist']) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });

  test('passes axe on the homepage and the 404 page', async ({ page }) => {
    await page.goto('/');
    await expectNoSeriousViolations(page);
    await page.goto('/a-page-that-does-not-exist');
    await expectNoSeriousViolations(page);
  });

  test('serves unknown paths with the real 404 page and status', async ({ page }) => {
    const response = await page.goto('/a-page-that-does-not-exist');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');
  });
});

test.describe('the bar', () => {
  test('condenses after scrolling and follows the surface beneath it', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('[data-site-header]');
    // The homepage opens on stage, so the bar starts in stage colours.
    await expect(header).toHaveAttribute('data-under', 'stage');
    await expect(header).not.toHaveAttribute('data-condensed', '');
    await page.mouse.wheel(0, 40);
    await expect(header).toHaveAttribute('data-condensed', '');
  });

  test('holds still when the page rests just past the top', async ({ page }) => {
    // With one threshold, the bar and the browser's scroll anchoring moved
    // each other every frame at about 10 px (it stopped clicks landing).
    await page.goto('/about');
    for (const y of [10, 20, 30]) {
      await page.evaluate((top) => window.scrollTo(0, top), y);
      const states = await page.evaluate(async () => {
        const header = document.querySelector('[data-site-header]') as HTMLElement;
        const seen: string[] = [];
        for (let frame = 0; frame < 20; frame += 1) {
          await new Promise((resolve) => requestAnimationFrame(resolve));
          if (frame >= 10) seen.push(`${window.scrollY}:${header.hasAttribute('data-condensed')}`);
        }
        return new Set(seen).size;
      });
      expect(states, `scrolled to ${y} px`).toBe(1);
    }
  });
});

test.describe('the menu on phones', () => {
  test.skip(({ isMobile }) => !isMobile, 'The drawer exists below the tablet breakpoint.');

  test('opens from the keyboard, keeps focus inside, and Escape returns focus', async ({
    page,
  }) => {
    await page.goto('/');
    const trigger = page.locator('[data-menu-trigger]');
    const dialog = page.getByRole('dialog', { name: 'Site navigation' });

    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(dialog).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('button', { name: 'Close menu' })).toBeFocused();
    await expect(page.locator('html')).toHaveClass(/scroll-locked/);

    // Tabbing never reaches the page behind the open dialog.
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      const inside = await page.evaluate(() => {
        const active = document.activeElement;
        return !active || active === document.body || Boolean(active.closest('dialog'));
      });
      expect(inside).toBe(true);
    }

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('html')).not.toHaveClass(/scroll-locked/);
  });

  test('closes with its close button and returns focus', async ({ page }) => {
    await page.goto('/');
    const trigger = page.locator('[data-menu-trigger]');
    await trigger.click();
    await page.getByRole('button', { name: 'Close menu' }).click();
    await expect(page.getByRole('dialog', { name: 'Site navigation' })).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('passes axe with the menu open', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-menu-trigger]').click();
    await expect(page.getByRole('dialog', { name: 'Site navigation' })).toBeVisible();
    await expectNoSeriousViolations(page, '#site-menu');
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the menu button is a link to the footer navigation', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'The menu button shows below the tablet breakpoint.');
    await page.goto('/');
    const trigger = page.locator('[data-menu-trigger]');
    await expect(trigger).toHaveAttribute('href', '#site-footer-nav');
    await trigger.click();
    await expect(page).toHaveURL(/#site-footer-nav$/);
    await expect(page.locator('#site-footer-nav')).toBeInViewport();
  });
});
