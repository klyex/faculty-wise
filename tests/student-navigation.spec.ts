import { test, expect } from '@playwright/test';

test.describe('Student Navigation', () => {
  test('should navigate to all core student pages from the sidebar', async ({ page }) => {
    // Start at the student dashboard directly via bypass
    await page.goto('/student');
    await expect(page).toHaveURL('/student');
    await expect(page.getByRole('heading', { name: 'Hello, John Smith' })).toBeVisible();

    // Navigate to My Schedule
    await page.getByRole('link', { name: 'My Schedule' }).click();
    await expect(page).toHaveURL('/student/schedule');
    await expect(page.getByRole('heading', { name: 'My Schedule' })).toBeVisible();

    // Navigate to Department Schedule
    await page.getByRole('link', { name: 'Department Schedule' }).click();
    await expect(page).toHaveURL('/student/department-schedule');
    await expect(page.getByRole('heading', { name: 'Department Schedule' })).toBeVisible();

    // Navigate to Profile (Settings)
    await page.getByRole('link', { name: 'Profile' }).click();
    await expect(page).toHaveURL('/student/settings');
    await expect(page.getByRole('heading', { name: 'Profile Settings' })).toBeVisible();

    // Navigate back to Student Dashboard
    await page.getByRole('link', { name: 'My Dashboard' }).click();
    await expect(page).toHaveURL('/student');
    await expect(page.getByRole('heading', { name: 'Hello, John Smith' })).toBeVisible();
  });
});
