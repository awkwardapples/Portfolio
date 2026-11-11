import { expect, test } from './fixtures';

/**
 * The CV's short links (Pass 11, D; ADR-0051), against the Worker and its
 * static assets: a 301 straight to the document, then the card in view,
 * with the reader open on wider screens and only a scroll on phones.
 */

const LINKS: [path: string, target: string][] = [
  ['/intro-to-deep-learning', '/work/introduction-to-deep-learning#read'],
  ['/extracting-image-data', '/work/kerr-microscopy-dissertation#read'],
  ['/cv', '/cv.pdf'],
];

test('each short link answers 301 with the exact target, with or without a trailing slash', async ({
  request,
}) => {
  for (const [path, target] of LINKS) {
    for (const variant of [path, `${path}/`]) {
      const response = await request.get(variant, { maxRedirects: 0 });
      expect(response.status(), variant).toBe(301);
      expect(response.headers()['location'], variant).toBe(target);
    }
  }
});

const DOCUMENTS: [path: string, title: string][] = [
  ['/intro-to-deep-learning', 'Introduction to Deep Learning'],
  ['/extracting-image-data', 'Extracting magnetic information from Kerr Microscopy images'],
];

for (const [path, title] of DOCUMENTS) {
  test(`${path} lands on the document`, async ({ page, isMobile }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/#read$/);
    const card = page.locator('#read');
    await expect(card.locator('[data-document-heading]')).toHaveText(title);
    await expect(card).toBeInViewport();
    if (isMobile) {
      // Phones only scroll: Open and Download are right there.
      await expect(card.getByRole('link', { name: /^Open in a new tab/ })).toBeVisible();
      await expect(card.locator('iframe')).toHaveCount(0);
    } else {
      // The reader opens as if "Read here" were pressed; focus stays on the card's heading.
      await expect(card.locator('iframe')).toHaveAttribute('src', /\/documents\/.+\.pdf$/);
      await expect(card.getByRole('button', { name: 'Close the document' })).toBeVisible();
      await expect(card.locator('[data-document-heading]')).toBeFocused();
    }
  });
}
