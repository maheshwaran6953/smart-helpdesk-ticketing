import { test, expect } from '@playwright/test';
import { login } from './auth-helpers.js';

test.describe('Admin Operations', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'maheshwaranpalanisamy1@gmail.com', 'mahesh12345678@');
  });

  test('Dashboard KPIs load with numbers', async ({ page }) => {
    const kpiValues = page.locator('.font-heading.font-extrabold.text-\\[38px\\]');
    await expect(kpiValues.first()).toBeVisible();
    
    const valText = await kpiValues.first().innerText();
    const val = parseInt(valText.replace(/[^0-9]/g, ''));
    expect(val).toBeGreaterThan(0);
  });

  test('Export CSV button is visible', async ({ page }) => {
    await expect(page.locator('button', { hasText: /export|csv/i }).first()).toBeVisible();
  });

  test('All Tickets table loads and filters', async ({ page }) => {
    await page.goto('/admin/tickets');
    const rows = page.locator('.data-table tbody tr');
    await expect(rows.first()).toBeVisible();

    const searchInput = page.getByPlaceholder(/Filter/i);
    await searchInput.fill('Test Ticket');
    await page.waitForTimeout(1000); 
    
    await page.selectOption('select', { label: 'Resolved' });
    await expect(page.locator('text=Total Records')).toBeVisible();
  });

  test('Navigating to Ticket Detail from table', async ({ page }) => {
    await page.goto('/admin/tickets');
    await page.locator('.data-table tbody tr').first().click();
    await expect(page).toHaveURL(/\/admin\/tickets\/\d+/);
  });

  test('Ticket Detail actions', async ({ page }) => {
    await page.goto('/admin/tickets');
    await page.locator('.data-table tbody tr').first().click();

    await expect(page.locator('h1')).toBeVisible();
    
    // Status Update
    await page.getByRole('combobox').filter({ hasText: 'Select state...' }).selectOption({ label: 'Mark as Resolved' });
    await page.getByPlaceholder('Provide administrative justification...').fill('Admin resolving via automated test');
    await page.getByRole('button', { name: 'Synchronize State' }).click();
    await expect(page.getByText('System record updated')).toBeVisible();

    // Comment submission
    await page.getByPlaceholder('Type a corporate message...').fill('Admin automated comment');
    await page.getByRole('button', { name: 'Dispatch' }).click();
    await expect(page.getByText('Admin automated comment')).toBeVisible();

    // Audit Logs (System Ledger tab)
    await page.getByRole('button', { name: /System Ledger/i }).click();
    await expect(page.locator('.border-l-2.border-border')).toBeVisible();
  });

  test('Predictive AI tabs load correctly', async ({ page }) => {
    await page.goto('/admin/predictive');
    // Using loose text match for labels as they might be uppercase or slightly different
    await expect(page.getByText(/Critical Breach Forecast/i)).toBeVisible();
    
    await page.getByText(/Fatigue Analytics/i).click();
    await expect(page.getByText(/Operational Burnout Risk/i)).toBeVisible();

    await page.getByText(/Demand Forecast/i).click();
    await expect(page.getByText(/Incoming Ticket Volume/i)).toBeVisible();
  });
});
