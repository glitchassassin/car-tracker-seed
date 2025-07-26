/**
 * Car Database Access Layer
 * Provides type-safe operations for car data management
 */

export type CarStatus = 'PRE_ARRIVAL' | 'REGISTERED' | 'ON_DECK' | 'DONE'

// Array of all valid car colors
export const VALID_CAR_COLORS = [
	'white',
	'black',
	'gray',
	'silver',
	'blue',
	'red',
	'green',
	'brown',
	'orange',
	'gold',
	'purple',
	'yellow',
] as const

export type CarColor = (typeof VALID_CAR_COLORS)[number]

// Helper function to check if a string is a valid car color
export function isValidCarColor(color: string): color is CarColor {
	return VALID_CAR_COLORS.includes(color as CarColor)
}

export interface Car {
	id: number
	make: string
	model: string
	color: CarColor
	license_plate: string
	status: CarStatus
	created_at: string
	registered_at: string | null
	on_deck_at: string | null
	completed_at: string | null
}

export interface CarInput {
	id: number
	make: string
	model: string
	color: CarColor
	license_plate: string
}

/**
 * Car Database Operations
 * Encapsulates all database operations for car data
 */
export class CarDB {
	constructor(private db: D1Database) {}

	/**
	 * Get a car by ID
	 */
	async getCarById(id: number): Promise<Car | null> {
		try {
			const result = await this.db
				.prepare('SELECT * FROM cars WHERE id = ?')
				.bind(id)
				.first<Car>()

			return result || null
		} catch (error) {
			console.error('Error fetching car by ID:', error)
			throw new Error(`Failed to fetch car with ID ${id}`)
		}
	}

	/**
	 * Get all cars filtered by status
	 */
	async getCarsByStatus(status: CarStatus): Promise<Car[]> {
		try {
			const result = await this.db
				.prepare('SELECT * FROM cars WHERE status = ? ORDER BY id ASC')
				.bind(status)
				.all<Car>()

			return result.results || []
		} catch (error) {
			console.error('Error fetching cars by status:', error)
			throw new Error(`Failed to fetch cars with status ${status}`)
		}
	}

	/**
	 * Get all cars (for display purposes)
	 */
	async getAllCars(): Promise<Car[]> {
		try {
			const result = await this.db
				.prepare('SELECT * FROM cars ORDER BY id ASC')
				.all<Car>()

			return result.results || []
		} catch (error) {
			console.error('Error fetching all cars:', error)
			throw new Error('Failed to fetch all cars')
		}
	}

	/**
	 * Update car status with timestamp tracking
	 */
	async updateCarStatus(id: number, newStatus: CarStatus): Promise<Car | null> {
		const timestampField = this.getTimestampField(newStatus)
		const currentTime = new Date().toISOString()

		try {
			// Update status and appropriate timestamp
			let query = 'UPDATE cars SET status = ?'
			let params: any[] = [newStatus]

			if (timestampField) {
				query += `, ${timestampField} = ?`
				params.push(currentTime)
			}

			query += ' WHERE id = ?'
			params.push(id)

			const updateResult = await this.db
				.prepare(query)
				.bind(...params)
				.run()

			if (updateResult.meta.changes === 0) {
				return null // Car not found
			}

			// Return the updated car
			return await this.getCarById(id)
		} catch (error) {
			console.error('Error updating car status:', error)
			throw new Error(`Failed to update car ${id} to status ${newStatus}`)
		}
	}

	/**
	 * Get the timestamp field name for a given status
	 */
	private getTimestampField(status: CarStatus): string | null {
		switch (status) {
			case 'REGISTERED':
				return 'registered_at'
			case 'ON_DECK':
				return 'on_deck_at'
			case 'DONE':
				return 'completed_at'
			default:
				return null
		}
	}

	/**
	 * Search cars by license plate (partial match)
	 */
	async searchCarsByLicensePlate(licensePlate: string): Promise<Car[]> {
		try {
			const result = await this.db
				.prepare(
					'SELECT * FROM cars WHERE license_plate LIKE ? ORDER BY id ASC',
				)
				.bind(`%${licensePlate}%`)
				.all<Car>()

			return result.results || []
		} catch (error) {
			console.error('Error searching cars by license plate:', error)
			throw new Error(`Failed to search cars by license plate ${licensePlate}`)
		}
	}

	/**
	 * Get car statistics for reporting
	 */
	async getCarStatistics(): Promise<{
		total: number
		byStatus: Record<CarStatus, number>
	}> {
		try {
			const totalResult = await this.db
				.prepare('SELECT COUNT(*) as count FROM cars')
				.first<{ count: number }>()

			const statusResult = await this.db
				.prepare('SELECT status, COUNT(*) as count FROM cars GROUP BY status')
				.all<{ status: CarStatus; count: number }>()

			const byStatus: Record<CarStatus, number> = {
				PRE_ARRIVAL: 0,
				REGISTERED: 0,
				ON_DECK: 0,
				DONE: 0,
			}

			statusResult.results?.forEach((row) => {
				byStatus[row.status] = row.count
			})

			return {
				total: totalResult?.count || 0,
				byStatus,
			}
		} catch (error) {
			console.error('Error fetching car statistics:', error)
			throw new Error('Failed to fetch car statistics')
		}
	}

	/**
	 * Validate car data
	 */
	validateCarData(car: Partial<CarInput>): string[] {
		const errors: string[] = []

		if (!car.id || typeof car.id !== 'number' || car.id <= 0) {
			errors.push('ID must be a positive number')
		}

		if (
			!car.make ||
			typeof car.make !== 'string' ||
			car.make.trim().length === 0
		) {
			errors.push('Make is required')
		}

		if (
			!car.model ||
			typeof car.model !== 'string' ||
			car.model.trim().length === 0
		) {
			errors.push('Model is required')
		}

		// Validate color against CarColor type
		if (
			!car.color ||
			typeof car.color !== 'string' ||
			!isValidCarColor(car.color)
		) {
			errors.push(`Color must be one of: ${VALID_CAR_COLORS.join(', ')}`)
		}

		if (
			!car.license_plate ||
			typeof car.license_plate !== 'string' ||
			car.license_plate.trim().length === 0
		) {
			errors.push('License plate is required')
		}

		return errors
	}
}

/**
 * Create a CarDB instance from the environment
 */
export function createCarDB(env: { DB: D1Database }): CarDB {
	return new CarDB(env.DB)
}
