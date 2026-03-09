/** @param {import('@playwright/test').Page} page */
export async function login(page, email, pass) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', pass);
  await page.click('button[type="submit"]');
  // Wait for session initialization and redirection
  await page.waitForURL(/\/(admin|agent|user)/, { timeout: 15000 });
}
