import { test, expect } from '@playwright/test';
import { login } from './auth-helpers.js';

test.describe('User Service Request Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'user1@helpdesk.com', 'user123');
  });

  test('Submit new service request with AI priority suggestion', async ({ page }) => {
    // Nav text: "Open New Request" or "New Ticket"
    await page.click('text=Open New Request'); 
    
    await page.fill('input[placeholder*="Title"]', 'Automated Test Ticket');
    
    const descInput = page.locator('textarea[placeholder*="issue"]');
    await descInput.fill('I am experiencing a severe network outage in the main server room.');
    await descInput.blur();
    
    // AI suggestion box check
    await expect(page.locator('.ai-suggestion-box')).toBeVisible();

    await page.click('button:has-text("Incept Ticket")');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('Verify and Close Ticket Resolution', async ({ page }) => {
    await page.goto('/user/tickets');
    // Find card with "Action Needed" or "Pending Verification"
    const pendingCard = page.locator('div[style*="background: white"]:has-text("Action Needed")').first();
    await pendingCard.click();

    // Labels: "Yes, Issue is Fixed", "No, Still Having Issues"
    const fixedBtn = page.locator('button', { hasText: 'Yes, Issue is Fixed' });
    await expect(fixedBtn).toBeVisible();
    await fixedBtn.click();
    
    await expect(page.locator('text=Resolution Confirmed')).toBeVisible();
  });

  test('Reject Resolution', async ({ page }) => {
    await page.goto('/user/tickets');
    const pendingCard = page.locator('div[style*="background: white"]:has-text("Action Needed")').first();
    await pendingCard.click();

    const rejectBtn = page.locator('button', { hasText: 'No, Still Having Issues' });
    await expect(rejectBtn).toBeVisible();
    await rejectBtn.click();
    
    await expect(page.locator('text=Status Updated')).toBeVisible();
  });
});
