import { test, expect } from '@playwright/test';
import { login } from './auth-helpers.js';

test.describe('Authentication & Role Guards', () => {
  test('Admin login redirects to /admin', async ({ page }) => {
    await login(page, 'maheshwaranpalanisamy1@gmail.com', 'mahesh12345678@');
    await expect(page).toHaveURL(/.*admin/);
  });

  test('Agent login redirects to /agent', async ({ page }) => {
    await login(page, 'agent1@helpdesk.com', 'agent123');
    await expect(page).toHaveURL(/.*agent/);
  });

  test('User login redirects to /user', async ({ page }) => {
    await login(page, 'user1@helpdesk.com', 'user123');
    await expect(page).toHaveURL(/.*user/);
  });

  test('Wrong password shows error message', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('name@organization.com').fill('maheshwaranpalanisamy1@gmail.com');
    await page.getByPlaceholder('••••••••').fill('wrongpass');
    await page.getByRole('button', { name: 'Authenticate Identity' }).click();
    
    // Increased timeout and used text match
    await expect(page.getByText(/Access denied|verify your credentials/i)).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.bg-red-soft')).toBeVisible();
  });

  test('Protected routes redirect to /login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/.*login/);
  });

  test('Agent cannot access /admin (Role Guard)', async ({ page }) => {
    await login(page, 'agent1@helpdesk.com', 'agent123');
    await page.goto('/admin');
    await expect(page).toHaveURL(/.*agent/);
  });

  test('Logout clears session', async ({ page }) => {
    await login(page, 'user1@helpdesk.com', 'user123');
    await page.getByRole('button', { name: /Logout/i }).click(); 
    await expect(page).toHaveURL(/.*login/);
    
    await page.goto('/user');
    await expect(page).toHaveURL(/.*login/);
  });
});
