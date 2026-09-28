import { test, expect } from '@playwright/test';

test.describe('Admin Navigation', () => {
  test('should navigate to all core admin pages from the sidebar', async ({ page }) => {
    // Start at the dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('heading', { name: 'Operations Dashboard' })).toBeVisible();

    // Navigate to Timetables
    await page.getByRole('link', { name: 'Timetables' }).click();
    await expect(page).toHaveURL('/timetables');
    await expect(page.getByRole('heading', { name: 'Timetables' })).toBeVisible();

    // Navigate to Faculty Load
    await page.getByRole('link', { name: 'Faculty Load' }).click();
    await expect(page).toHaveURL('/faculty-load');
    await expect(page.getByRole('heading', { name: 'Faculty Load' })).toBeVisible();

    // Navigate to Courses
    await page.getByRole('link', { name: 'Courses' }).click();
    await expect(page).toHaveURL('/courses');
    await expect(page.getByRole('heading', { name: 'Courses' })).toBeVisible();

    // Navigate to Rooms & Labs
    await page.getByRole('link', { name: 'Rooms & Labs' }).click();
    await expect(page).toHaveURL('/rooms');
    await expect(page.getByRole('heading', { name: 'Rooms & Labs' })).toBeVisible();

    // Navigate to Room Availability
    await page.getByRole('link', { name: 'Room Availability' }).click();
    await expect(page).toHaveURL('/room-availability');
    await expect(page.getByRole('heading', { name: 'Room Availability' })).toBeVisible();

    // Navigate to Settings
    await page.getByRole('link', { name: 'Settings' }).click();
    await expect(page).toHaveURL('/settings');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

    // Navigate back to Dashboard
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('heading', { name: 'Operations Dashboard' })).toBeVisible();
  });
});
