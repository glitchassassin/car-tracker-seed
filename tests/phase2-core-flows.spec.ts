import AxeBuilder from '@axe-core/playwright'
import { test, expect } from '@playwright/test'
import { createCar, deleteCar } from './helpers/cars'
import type { TestCar } from './helpers/cars'

test.describe('Phase 2: Core Status Tracking & Volunteer Interfaces', () => {
	test.describe('Test Plan 1', () => {
		let carId: number

		test.beforeAll(async ({ browser }) => {
			const page = await browser.newPage()
			const uniqueLicensePlate = `TEST_${Math.random().toString(36).slice(2, 8)}`
			const testCarData: TestCar = {
				make: 'Honda',
				model: 'Civic',
				color: 'Blue',
				license_plate: uniqueLicensePlate,
				status: 'PRE_ARRIVAL',
			}

			const createdCar = await createCar(page, testCarData)
			carId = createdCar.id
			await page.close()
		})

		test.afterAll(async ({ browser }) => {
			const page = await browser.newPage()
			await deleteCar(page, carId)
			await page.close()
		})

		test('Car Journey Flow via Queues', async ({ page }) => {
			// Registration Phase
			await page.goto('/')

			// Select Registration mode
			await page.getByRole('link', { name: /registration/i }).click()

			// Verify the created car appears in PRE_ARRIVAL queue
			await expect(page.getByTestId(`car-${carId}`)).toBeVisible()

			// Select the created car from queue to navigate to details page
			await page.getByTestId(`car-${carId}`).click()

			// Verify car details display correctly
			await expect(page.getByText('Honda')).toBeVisible()
			await expect(page.getByText('Civic')).toBeVisible()
			await expect(page.getByText('Blue')).toBeVisible()

			// Click "Register Car" button
			await page.getByRole('button', { name: /register car/i }).click()

			// Verify user is automatically redirected to /registration
			await expect(page).toHaveURL('/registration')

			// Floor Phase
			await page.goto('/')

			// Select Floor mode
			await page.getByRole('link', { name: /floor/i }).click()

			// Verify the created car appears in REGISTERED queue
			await expect(page.getByTestId(`car-${carId}`)).toBeVisible()

			// Select the created car from queue to navigate to details page
			await page.getByTestId(`car-${carId}`).click()

			// Verify car details display correctly
			await expect(page.getByText('Honda')).toBeVisible()
			await expect(page.getByText('Civic')).toBeVisible()
			await expect(page.getByText('Blue')).toBeVisible()

			// Click "Start Service" button
			await page.getByRole('button', { name: /start service/i }).click()

			// Verify user is automatically redirected to /floor
			await expect(page).toHaveURL('/floor')

			// Handoff Phase
			await page.goto('/')

			// Select Handoff mode
			await page.getByRole('link', { name: /handoff/i }).click()

			// Verify the created car appears in ON_DECK queue
			await expect(page.getByTestId(`car-${carId}`)).toBeVisible()

			// Select the created car from queue to navigate to details page
			await page.getByTestId(`car-${carId}`).click()

			// Verify car details display correctly
			await expect(page.getByText('Honda')).toBeVisible()
			await expect(page.getByText('Civic')).toBeVisible()
			await expect(page.getByText('Blue')).toBeVisible()

			// Click "Ready for Pickup" button
			await page.getByRole('button', { name: /ready for pickup/i }).click()

			// Verify user is automatically redirected to /handoff
			await expect(page).toHaveURL('/handoff')
		})
	})

	test.describe('Test Plan 2', () => {
		let carId: number

		test.beforeAll(async ({ browser }) => {
			const page = await browser.newPage()
			const uniqueLicensePlate = `TEST_${Math.random().toString(36).slice(2, 8)}`
			const testCarData: TestCar = {
				make: 'Toyota',
				model: 'Camry',
				color: 'Silver',
				license_plate: uniqueLicensePlate,
				status: 'PRE_ARRIVAL',
			}

			const createdCar = await createCar(page, testCarData)
			carId = createdCar.id
			await page.close()
		})

		test.afterAll(async ({ browser }) => {
			const page = await browser.newPage()
			await deleteCar(page, carId)
			await page.close()
		})

		test('Car Journey Flow via Search', async ({ page }) => {
			// Registration Phase
			await page.goto('/')

			// Select Registration mode
			await page.getByRole('link', { name: /registration/i }).click()

			// Search for the created car by ID
			await page.getByPlaceholder(/enter car id/i).fill(carId.toString())
			await page.getByRole('button', { name: /search/i }).click()

			// Verify we're redirected to the car detail page
			await expect(page).toHaveURL(`/registration/${carId}`)

			// Verify car details display correctly
			await expect(page.getByText('Toyota')).toBeVisible()
			await expect(page.getByText('Camry')).toBeVisible()
			await expect(page.getByText('Silver')).toBeVisible()

			// Click "Register Car" button
			await page.getByRole('button', { name: /register car/i }).click()

			// Verify user is automatically redirected to /registration
			await expect(page).toHaveURL('/registration')

			// Floor Phase
			await page.goto('/')

			// Select Floor mode
			await page.getByRole('link', { name: /floor/i }).click()

			// Search for the created car by ID
			await page.getByPlaceholder(/enter car id/i).fill(carId.toString())
			await page.getByRole('button', { name: /search/i }).click()

			// Verify we're redirected to the car detail page
			await expect(page).toHaveURL(`/floor/${carId}`)

			// Verify car details display correctly
			await expect(page.getByText('Toyota')).toBeVisible()
			await expect(page.getByText('Camry')).toBeVisible()
			await expect(page.getByText('Silver')).toBeVisible()

			// Click "Start Service" button
			await page.getByRole('button', { name: /start service/i }).click()

			// Verify user is automatically redirected to /floor
			await expect(page).toHaveURL('/floor')

			// Handoff Phase
			await page.goto('/')

			// Select Handoff mode
			await page.getByRole('link', { name: /handoff/i }).click()

			// Search for the created car by ID
			await page.getByPlaceholder(/enter car id/i).fill(carId.toString())
			await page.getByRole('button', { name: /search/i }).click()

			// Verify we're redirected to the car detail page
			await expect(page).toHaveURL(`/handoff/${carId}`)

			// Verify car details display correctly
			await expect(page.getByText('Toyota')).toBeVisible()
			await expect(page.getByText('Camry')).toBeVisible()
			await expect(page.getByText('Silver')).toBeVisible()

			// Click "Ready for Pickup" button
			await page.getByRole('button', { name: /ready for pickup/i }).click()

			// Verify user is automatically redirected to /handoff
			await expect(page).toHaveURL('/handoff')
		})
	})

	test.describe('Test Plan 3: Out-Of-Order Statuses', () => {
		let carId1: number
		let carId2: number

		test.beforeAll(async ({ browser }) => {
			const page = await browser.newPage()

			// Create first test car
			const uniqueLicensePlate1 = `TEST_${Math.random().toString(36).slice(2, 8)}`
			const testCarData1: TestCar = {
				make: 'Ford',
				model: 'Focus',
				color: 'Red',
				license_plate: uniqueLicensePlate1,
				status: 'PRE_ARRIVAL',
			}
			const createdCar1 = await createCar(page, testCarData1)
			carId1 = createdCar1.id

			// Create second test car
			const uniqueLicensePlate2 = `TEST_${Math.random().toString(36).slice(2, 8)}`
			const testCarData2: TestCar = {
				make: 'Nissan',
				model: 'Altima',
				color: 'Black',
				license_plate: uniqueLicensePlate2,
				status: 'PRE_ARRIVAL',
			}
			const createdCar2 = await createCar(page, testCarData2)
			carId2 = createdCar2.id

			await page.close()
		})

		test.afterAll(async ({ browser }) => {
			const page = await browser.newPage()
			await deleteCar(page, carId1)
			await deleteCar(page, carId2)
			await page.close()
		})

		test('Floor Phase - Process first car directly from PRE_ARRIVAL', async ({
			page,
		}) => {
			// Floor Phase - Process first car directly from PRE_ARRIVAL
			await page.goto('/floor')

			// Search for the first created car by ID
			await page.getByPlaceholder(/enter car id/i).fill(carId1.toString())
			await page.getByRole('button', { name: /search/i }).click()

			// Verify we're redirected to the car detail page
			await expect(page).toHaveURL(`/floor/${carId1}`)

			// Verify car details display correctly
			await expect(page.getByText('Ford')).toBeVisible()
			await expect(page.getByText('Focus')).toBeVisible()
			await expect(page.getByText('Red')).toBeVisible()

			// Click "Start Service" button
			await page.getByRole('button', { name: /start service/i }).click()

			// Verify user is automatically redirected to /floor
			await expect(page).toHaveURL('/floor')
		})

		test('Handoff Phase - Process second car directly from PRE_ARRIVAL', async ({
			page,
		}) => {
			// Handoff Phase - Process second car directly from PRE_ARRIVAL
			await page.goto('/handoff')

			// Search for the second created car by ID
			await page.getByPlaceholder(/enter car id/i).fill(carId2.toString())
			await page.getByRole('button', { name: /search/i }).click()

			// Verify we're redirected to the car detail page
			await expect(page).toHaveURL(`/handoff/${carId2}`)

			// Verify car details display correctly
			await expect(page.getByText('Nissan')).toBeVisible()
			await expect(page.getByText('Altima')).toBeVisible()
			await expect(page.getByText('Black')).toBeVisible()

			// Click "Ready for Pickup" button
			await page.getByRole('button', { name: /ready for pickup/i }).click()

			// Verify user is automatically redirected to /handoff
			await expect(page).toHaveURL('/handoff')
		})
	})

	test.describe('Test Plan 4: Accessibility', () => {
		let carId: number

		test.beforeAll(async ({ browser }) => {
			const page = await browser.newPage()
			const uniqueLicensePlate = `TEST_${Math.random().toString(36).slice(2, 8)}`
			const testCarData: TestCar = {
				make: 'Chevrolet',
				model: 'Malibu',
				color: 'White',
				license_plate: uniqueLicensePlate,
				status: 'PRE_ARRIVAL',
			}

			const createdCar = await createCar(page, testCarData)
			carId = createdCar.id
			await page.close()
		})

		test.afterAll(async ({ browser }) => {
			const page = await browser.newPage()
			await deleteCar(page, carId)
			await page.close()
		})

		test('Home Screen', async ({ page }) => {
			// Home Screen
			await page.goto('/')

			// Check accessibility with Axe
			const homeAccessibilityScanResults = await new AxeBuilder({
				page,
			}).analyze()
			expect(homeAccessibilityScanResults.violations).toEqual([])
		})

		test('Registration Phase', async ({ page }) => {
			// Registration Phase
			await page.goto('/registration')

			// Check accessibility with Axe
			const registrationAccessibilityScanResults = await new AxeBuilder({
				page,
			}).analyze()
			expect(registrationAccessibilityScanResults.violations).toEqual([])

			// Search for the created car by ID to navigate to details page
			await page.getByPlaceholder(/enter car id/i).fill(carId.toString())
			await page.getByRole('button', { name: /search/i }).click()

			// Check accessibility with Axe
			const registrationDetailsAccessibilityScanResults = await new AxeBuilder({
				page,
			}).analyze()
			expect(registrationDetailsAccessibilityScanResults.violations).toEqual([])
		})

		test('Floor Phase', async ({ page }) => {
			// Floor Phase
			await page.goto('/floor')

			// Check accessibility with Axe
			const floorAccessibilityScanResults = await new AxeBuilder({
				page,
			}).analyze()
			expect(floorAccessibilityScanResults.violations).toEqual([])

			// Search for the created car by ID to navigate to details page
			await page.getByPlaceholder(/enter car id/i).fill(carId.toString())
			await page.getByRole('button', { name: /search/i }).click()

			// Check accessibility with Axe
			const floorDetailsAccessibilityScanResults = await new AxeBuilder({
				page,
			}).analyze()
			expect(floorDetailsAccessibilityScanResults.violations).toEqual([])
		})

		test('Handoff Phase', async ({ page }) => {
			// Handoff Phase
			await page.goto('/handoff')

			// Check accessibility with Axe
			const handoffAccessibilityScanResults = await new AxeBuilder({
				page,
			}).analyze()
			expect(handoffAccessibilityScanResults.violations).toEqual([])

			// Search for the created car by ID to navigate to details page
			await page.getByPlaceholder(/enter car id/i).fill(carId.toString())
			await page.getByRole('button', { name: /search/i }).click()

			// Check accessibility with Axe
			const handoffDetailsAccessibilityScanResults = await new AxeBuilder({
				page,
			}).analyze()
			expect(handoffDetailsAccessibilityScanResults.violations).toEqual([])
		})
	})
})
