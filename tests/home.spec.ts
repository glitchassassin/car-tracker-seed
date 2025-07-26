import AxeBuilder from '@axe-core/playwright'
import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
	test('should render the home page correctly', async ({ page }) => {
		// Navigate to the home page
		await page.goto('/')

		// Check that the page title is correct
		await expect(page).toHaveTitle('Car Tracker - Volunteer Portal')

		// Check that the main heading is present
		await expect(
			page.getByRole('heading', { name: 'Car Tracker' }),
		).toBeVisible()

		// Check that the subtitle is present
		await expect(page.getByText('Select your volunteer role')).toBeVisible()

		// Check that all three volunteer role buttons are present
		await expect(page.getByRole('link', { name: 'Registration' })).toBeVisible()
		await expect(
			page.getByRole('link', { name: /At the floor entrance/i }),
		).toBeVisible()
		await expect(page.getByRole('link', { name: 'Handoff' })).toBeVisible()

		// Verify that the page has loaded completely by checking the main content area
		await expect(page.locator('main')).toBeVisible()

		// Run accessibility scan on the entire page
		const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
		expect(accessibilityScanResults.violations).toEqual([])
	})

	test('should have working volunteer role links', async ({ page }) => {
		await page.goto('/')

		// Test Registration link
		const registrationLink = page.getByRole('link', { name: 'Registration' })
		await expect(registrationLink).toHaveAttribute('href', '/registration')

		// Test Floor link
		const floorLink = page.getByRole('link', { name: /At the floor entrance/i })
		await expect(floorLink).toHaveAttribute('href', '/floor')

		// Test Handoff link
		const handoffLink = page.getByRole('link', { name: 'Handoff' })
		await expect(handoffLink).toHaveAttribute('href', '/handoff')
	})
})
