import { test, expect } from '@playwright/test';
import { login } from './auth-helpers.js';

test.describe('Agent Operational Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'agent1@helpdesk.com', 'agent123');
  });

  test('Agent sees their assigned tickets in cards', async ({ page }) => {
    await page.goto('/agent/tickets');
    // Agent MyTickets uses cards (divs with shadow and border-radius)
    const cards = page.locator('div[style*="background: white"][style*="border-radius: 16"]');
    await expect(cards.first()).toBeVisible();
  });

  test('Operational workflow buttons work', async ({ page }) => {
    await page.goto('/agent/tickets');
    const firstCard = page.locator('div[style*="background: white"][style*="border-radius: 16"]').first();
    await firstCard.click();

    // Specific button labels from user
    const startBtn = page.locator('button', { hasText: 'Start Working' });
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await expect(page.locator('text=adjusted to IN PROGRESS')).toBeVisible();
    }

    const resolveBtn = page.locator('button', { hasText: 'Mark as Resolved' });
    if (await resolveBtn.isVisible()) {
      await resolveBtn.click();
      await expect(page.locator('text=adjusted to RESOLVED')).toBeVisible();
    }
  });

  test('AI Resource Inquire & Apply Solution', async ({ page }) => {
    await page.goto('/agent/tickets');
    await page.locator('div[style*="background: white"][style*="border-radius: 16"]').first().click();

    // Label: "Get KB Suggestions"
    await page.click('text=Get KB Suggestions');
    await expect(page.locator('text=AI Resource Recommendations')).toBeVisible();
    
    await page.click('text=Append Suggestion');
    await expect(page.locator('text=Solution appended')).toBeVisible();
  });

  test('Breach Risk monitoring visibility', async ({ page }) => {
    await page.goto('/agent/tickets');
    await page.locator('div[style*="background: white"][style*="border-radius: 16"]').first().click();
    
    await expect(page.locator('text=Breach Risk Index')).toBeVisible();
  });
});
