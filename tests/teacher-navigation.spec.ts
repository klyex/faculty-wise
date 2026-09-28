import { test, expect } from '@playwright/test';

test.describe('Teacher Navigation', () => {
  test('should navigate to all core teacher pages from the sidebar', async ({ page }) => {
    // Start at the teacher dashboard directly via bypass
    await page.goto('/teacher');
    await expect(page).toHaveURL('/teacher');
    await expect(page.getByRole('heading', { name: 'Welcome, Prof. Doe' })).toBeVisible();

    // Navigate to My Schedule
    await page.getByRole('link', { name: 'My Schedule' }).click();
    await expect(page).toHaveURL('/teacher/schedule');
    await expect(page.getByRole('heading', { name: 'My Schedule' })).toBeVisible();

    // Navigate to Availability
    await page.getByRole('link', { name: 'Availability' }).click();
    await expect(page).toHaveURL('/teacher/availability');
    await expect(page.getByRole('heading', { name: 'Availability Submission' })).toBeVisible();

    // Navigate to Department Schedule
    await page.getByRole('link', { name: 'Department Schedule' }).click();
    await expect(page).toHaveURL('/teacher/department-schedule');
    await expect(page.getByRole('heading', { name: 'Department Schedule' })).toBeVisible();

    // Navigate to My Profile (Settings)
    await page.getByRole('link', { name: 'My Profile' }).click();
    await expect(page).toHaveURL('/teacher/settings');
    await expect(page.getByRole('heading', { name: 'My Profile' })).toBeVisible();

    // Navigate back to Teacher Dashboard
    await page.getByRole('link', { name: 'My Dashboard' }).click();
    await expect(page).toHaveURL('/teacher');
    await expect(page.getByRole('heading', { name: 'Welcome, Prof. Doe' })).toBeVisible();
  });
});
