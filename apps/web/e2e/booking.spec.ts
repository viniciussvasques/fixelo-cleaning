import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
    test('should load homepage', async ({ page }) => {
        await page.goto('/');

        await expect(page).toHaveTitle(/Fixelo/);
        await expect(page.locator('text=Fixelo')).toBeVisible();
    });

    test('should have navigation links', async ({ page }) => {
        await page.goto('/');

        await expect(page.getByRole('link', { name: /book now/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
    });

    test('should navigate to booking flow', async ({ page }) => {
        await page.goto('/');

        await page.click('text=Book Now');
        await expect(page).toHaveURL(/\/book/);
    });
});

test.describe('Booking Flow', () => {
    test('should display service selection', async ({ page }) => {
        await page.goto('/book');

        // Should show service options
        await expect(page.locator('text=Standard Clean').or(page.locator('text=Deep Clean'))).toBeVisible();
    });

    test('should navigate through booking steps', async ({ page }) => {
        await page.goto('/book');

        // Step 1: Select a service
        await page.click('text=Standard Clean');
        await page.click('button:has-text("Continue")');

        // Should be on home info step
        await expect(page.locator('input').first()).toBeVisible();
    });
});
