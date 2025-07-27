import type { Page } from '@playwright/test'
import { executeSQL } from './sql'

const VALID_CAR_COLORS = [
	'red',
	'blue',
	'green',
	'yellow',
	'orange',
	'purple',
	'pink',
	'brown',
	'black',
	'white',
	'gray',
	'silver',
	'gold',
	'navy',
	'maroon',
	'teal',
	'olive',
	'lime',
	'aqua',
	'fuchsia',
] as const

export interface TestCar {
	make: string
	model: string
	color: (typeof VALID_CAR_COLORS)[number]
	license_plate: string
	status?: 'PRE_ARRIVAL' | 'REGISTERED' | 'ON_DECK' | 'DONE' | 'PICKED_UP'
}

export interface TestCarWithId extends TestCar {
	id: number
}

export interface CarInDatabase extends TestCarWithId {
	created_at: string
	registered_at: string | null
	on_deck_at: string | null
	completed_at: string | null
	picked_up_at: string | null
}

/**
 * Create a single car in the test database
 * Returns the created car with its auto-generated ID
 */
export async function createCar(
	page: Page,
	car: TestCar,
): Promise<TestCarWithId> {
	const query = `
		INSERT INTO cars (make, model, color, license_plate, status)
		VALUES (
			'${car.make.replace(/'/g, "''")}',
			'${car.model.replace(/'/g, "''")}',
			'${car.color.replace(/'/g, "''")}',
			'${car.license_plate.replace(/'/g, "''")}',
			'${car.status || 'PRE_ARRIVAL'}'
		)
	`

	const result = await executeSQL(page, query)

	// Get the ID of the inserted car from the meta information
	const insertedId = result.meta?.last_row_id
	if (!insertedId) {
		throw new Error('Failed to get ID of inserted car')
	}

	return {
		...car,
		id: insertedId,
	}
}

/**
 * Delete a single car from the test database
 */
export async function deleteCar(page: Page, carId: number): Promise<void> {
	const query = `DELETE FROM cars WHERE id = ${carId}`
	await executeSQL(page, query)
}

/**
 * Get count of cars in the database
 */
export async function getCarCount(page: Page): Promise<number> {
	const result = await executeSQL(page, 'SELECT COUNT(*) as count FROM cars')
	return result.results?.[0]?.count || 0
}

/**
 * Get all cars from the database
 */
export async function getAllCars(page: Page): Promise<any[]> {
	const result = await executeSQL(page, 'SELECT * FROM cars ORDER BY id')
	return result.results || []
}

/**
 * Get a car by its ID
 */
export async function getCarById(
	page: Page,
	carId: number,
): Promise<TestCarWithId | null> {
	const result = await executeSQL(
		page,
		`SELECT * FROM cars WHERE id = ${carId}`,
	)
	return result.results?.[0] || null
}
