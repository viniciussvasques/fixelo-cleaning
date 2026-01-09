import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
    test('should display signin page', async ({ page }) => {
        await page.goto('/auth/signin');

        await expect(page).toHaveTitle(/Fixelo/);
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
    });

    test('should display signup page with role selection', async ({ page }) => {
        await page.goto('/auth/signup');

        await expect(page.locator('input[name="firstName"]')).toBeVisible();
        await expect(page.locator('input[name="email"]')).toBeVisible();
        // Role selection buttons
        await expect(page.getByRole('button', { name: /customer/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /cleaner/i })).toBeVisible();
    });

    test('should navigate to forgot password', async ({ page }) => {
        await page.goto('/auth/signin');

        await page.click('text=Forgot password');
        await expect(page).toHaveURL(/forgot-password/);
        await expect(page.locator('input[type="email"]')).toBeVisible();
    });

    test('should show validation errors on empty signup', async ({ page }) => {
        await page.goto('/auth/signup');

        await page.click('button[type="submit"]');

        // Should show validation errors
        await expect(page.locator('text=required').first()).toBeVisible({ timeout: 5000 });
    });
});
