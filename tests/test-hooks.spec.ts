import { test, expect } from '@playwright/test'
import { createCar, deleteCar, getAllCars, getCarById } from './helpers/cars'
import type { TestCar } from './helpers/cars'

test.describe('Test Hooks - Car Management', () => {
	test('should insert a car, verify it exists, delete it, and confirm removal', async ({
		page,
	}) => {
		// Define a test car with unique license plate (ID will be auto-generated)
		const uniqueId = `TEST${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
		const testCarData: TestCar = {
			make: 'Tesla',
			model: 'Model 3',
			color: 'White',
			license_plate: uniqueId,
			status: 'PRE_ARRIVAL',
		}

		// Step 1: Insert the test car
		const createdCar = await createCar(page, testCarData)
		console.log(
			`Inserted car: ${createdCar.make} ${createdCar.model} (${createdCar.license_plate}) with ID ${createdCar.id}`,
		)

		// Step 2: Verify our test car exists by finding it specifically
		const allCarsAfterInsert = await getAllCars(page)
		const insertedCar = allCarsAfterInsert.find(
			(car) => car.id === createdCar.id,
		)
		expect(insertedCar).toBeDefined()
		expect(insertedCar.make).toBe(testCarData.make)
		expect(insertedCar.model).toBe(testCarData.model)
		expect(insertedCar.color).toBe(testCarData.color)
		expect(insertedCar.license_plate).toBe(testCarData.license_plate)
		expect(insertedCar.status).toBe(testCarData.status)
		console.log(`Verified car exists: ID ${insertedCar.id}`)

		// Step 3: Delete the test car
		await deleteCar(page, createdCar.id)
		console.log(`Deleted car with ID: ${createdCar.id}`)

		// Step 4: Verify our test car no longer exists by checking specifically for it
		const deletedCar = await getCarById(page, createdCar.id)
		expect(deletedCar).toBeNull()
		console.log(`Verified car no longer exists: ID ${createdCar.id}`)
	})

	test('should handle multiple car operations', async ({ page }) => {
		// Create two test cars with unique license plates (IDs will be auto-generated)
		const timestamp = Date.now()
		const uniqueBase = Math.random().toString(36).slice(2, 8)
		const car1Data: TestCar = {
			make: 'Honda',
			model: 'Civic',
			color: 'Blue',
			license_plate: `TEST${timestamp}_${uniqueBase}A`,
		}

		const car2Data: TestCar = {
			make: 'Toyota',
			model: 'Camry',
			color: 'Silver',
			license_plate: `TEST${timestamp}_${uniqueBase}B`,
		}

		// Insert both cars
		const createdCar1 = await createCar(page, car1Data)
		const createdCar2 = await createCar(page, car2Data)

		// Verify both cars exist by finding them specifically
		const foundCar1 = await getCarById(page, createdCar1.id)
		const foundCar2 = await getCarById(page, createdCar2.id)

		expect(foundCar1).toBeDefined()
		expect(foundCar2).toBeDefined()
		expect(foundCar1?.make).toBe('Honda')
		expect(foundCar2?.make).toBe('Toyota')

		// Delete only the first car
		await deleteCar(page, createdCar1.id)

		// Verify only car1 is gone, car2 still exists
		const car1AfterDelete = await getCarById(page, createdCar1.id)
		const car2AfterDelete = await getCarById(page, createdCar2.id)

		expect(car1AfterDelete).toBeNull()
		expect(car2AfterDelete).toBeDefined()

		// Clean up: delete the remaining car
		await deleteCar(page, createdCar2.id)

		// Verify both cars are now gone
		const car1AfterCleanup = await getCarById(page, createdCar1.id)
		const car2AfterCleanup = await getCarById(page, createdCar2.id)

		expect(car1AfterCleanup).toBeNull()
		expect(car2AfterCleanup).toBeNull()
	})
})
