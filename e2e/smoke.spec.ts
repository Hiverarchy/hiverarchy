import { test, expect } from '@playwright/test';

test('home loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
});

test('login page loads', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /^login$/i })).toBeVisible();
});

test('signup page loads', async ({ page }) => {
  await page.goto('/signup');
  await expect(page.getByRole('heading', { name: /^sign up$/i })).toBeVisible();
});

test('resume route loads', async ({ page }) => {
  await page.goto('/resume');
  await expect(page).toHaveURL(/\/resume$/);
  await expect(page.locator('body')).toBeVisible();
});

test('username-scoped now route loads', async ({ page }) => {
  await page.goto('/golfergeek/now');
  await expect(page).toHaveURL(/\/golfergeek\/now$/);
  await expect(page.locator('body')).toBeVisible();
});
