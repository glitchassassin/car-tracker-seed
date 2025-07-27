/**
 * Car Database Access Layer
 * Provides type-safe operations for car data management
 */

export type CarStatus =
	| 'PRE_ARRIVAL'
	| 'REGISTERED'
	| 'ON_DECK'
	| 'DONE'
	| 'PICKED_UP'

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
	picked_up_at: string | null
}

export interface CarInput {
	id: number
	make: string
	model: string
	color: CarColor
	license_plate: string
}

export interface StatusHistoryEntry {
	id: number
	car_id: number
	previous_status: string | null
	new_status: string
	changed_at: string
}

/**
 * Car Database Operations
 * Encapsulates all database operations for car data
 */
export class CarDB {
	constructor(
		private db: D1Database,
		private env?: { CAR_UPDATES?: DurableObjectNamespace<any> },
	) {}

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
	 * Get cars for projector view (excludes PRE_ARRIVAL)
	 * Returns cars grouped by their display status
	 */
	async getProjectorCars(): Promise<{
		inProgressCars: Car[]
		doneCars: Car[]
	}> {
		try {
			// Get cars that are REGISTERED or ON_DECK (In Progress)
			const [inProgressResult, doneResult] = await Promise.all([
				this.db
					.prepare('SELECT * FROM cars WHERE status IN (?, ?) ORDER BY id ASC')
					.bind('REGISTERED', 'ON_DECK')
					.all<Car>(),
				this.db
					.prepare('SELECT * FROM cars WHERE status = ? ORDER BY id ASC')
					.bind('DONE')
					.all<Car>(),
			])

			return {
				inProgressCars: inProgressResult.results || [],
				doneCars: doneResult.results || [],
			}
		} catch (error) {
			console.error('Error fetching projector cars:', error)
			throw new Error('Failed to fetch projector cars')
		}
	}

	/**
	 * Update car status with timestamp tracking and history logging
	 */
	async updateCarStatus(id: number, newStatus: CarStatus): Promise<Car | null> {
		// Get the current car to capture the old status
		const currentCar = await this.getCarById(id)
		const oldStatus = currentCar?.status || 'UNKNOWN'

		const timestampField = this.getTimestampField(newStatus)
		const currentTime = new Date().toISOString()

		try {
			// Use D1's batch API to ensure both updates happen atomically
			const result = await this.db.batch([
				// Update status and appropriate timestamp
				(() => {
					let query = 'UPDATE cars SET status = ?'
					let params: any[] = [newStatus]

					if (timestampField) {
						query += `, ${timestampField} = ?`
						params.push(currentTime)
					}

					query += ' WHERE id = ?'
					params.push(id)

					return this.db.prepare(query).bind(...params)
				})(),
				// Insert status history record
				this.db
					.prepare(
						'INSERT INTO status_history (car_id, previous_status, new_status, changed_at) VALUES (?, ?, ?, ?)',
					)
					.bind(id, oldStatus, newStatus, currentTime),
			])

			// Check if the car update was successful
			if (result[0].meta.changes === 0) {
				return null // Car not found
			}

			// Get the updated car
			const updatedCar = await this.getCarById(id)

			// Broadcast the status update if we have the env
			if (this.env?.CAR_UPDATES && updatedCar) {
				try {
					await this.broadcastStatusUpdate(id, oldStatus, newStatus)
				} catch (error) {
					console.error('Failed to broadcast status update:', error)
				}
			}

			return updatedCar
		} catch (error) {
			console.error('Error updating car status:', error)
			throw new Error(`Failed to update car ${id} to status ${newStatus}`)
		}
	}

	/**
	 * Broadcast a car status update to connected clients
	 */
	private async broadcastStatusUpdate(
		carId: number,
		oldStatus: string,
		newStatus: string,
	): Promise<void> {
		if (!this.env?.CAR_UPDATES) return

		const { getCarUpdatesStub } = await import('./car-updates')
		const stub = getCarUpdatesStub(this.env as any)

		const update = {
			carId,
			oldStatus,
			newStatus,
			timestamp: new Date().toISOString(),
		}

		await stub.fetch('http://internal/broadcast', {
			method: 'POST',
			body: JSON.stringify(update),
		})
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
			case 'PICKED_UP':
				return 'picked_up_at'
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
	 * Search for cars by ID or license plate
	 * Returns the first matching car or null if not found
	 */
	async searchCarByIdOrLicensePlate(searchTerm: string): Promise<Car | null> {
		try {
			// Strip whitespace from search term
			const cleanSearchTerm = searchTerm.trim()

			// Only treat as ID if the search term is purely numeric
			if (/^\d+$/.test(cleanSearchTerm)) {
				const parsedId = parseInt(cleanSearchTerm, 10)
				// Search by ID first (exact match)
				const car = await this.getCarById(parsedId)
				if (car) {
					return car
				}
			}

			// If not found by ID or search term is not purely numeric, search by license plate (exact match)
			const result = await this.db
				.prepare(
					'SELECT * FROM cars WHERE license_plate = ? ORDER BY id ASC LIMIT 1',
				)
				.bind(cleanSearchTerm)
				.first<Car>()

			return result || null
		} catch (error) {
			console.error('Error searching car by ID or license plate:', error)
			throw new Error(`Failed to search car with term ${searchTerm}`)
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
				PICKED_UP: 0,
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
	 * Get status history for a specific car
	 */
	async getStatusHistory(carId: number): Promise<StatusHistoryEntry[]> {
		try {
			const result = await this.db
				.prepare(
					'SELECT * FROM status_history WHERE car_id = ? ORDER BY changed_at DESC',
				)
				.bind(carId)
				.all<StatusHistoryEntry>()

			return result.results || []
		} catch (error) {
			console.error('Error fetching status history:', error)
			throw new Error(`Failed to fetch status history for car ${carId}`)
		}
	}

	/**
	 * Get recent status changes across all cars
	 */
	async getRecentStatusChanges(
		limit: number = 50,
	): Promise<StatusHistoryEntry[]> {
		try {
			const result = await this.db
				.prepare(
					'SELECT * FROM status_history ORDER BY changed_at DESC LIMIT ?',
				)
				.bind(limit)
				.all<StatusHistoryEntry>()

			return result.results || []
		} catch (error) {
			console.error('Error fetching recent status changes:', error)
			throw new Error('Failed to fetch recent status changes')
		}
	}

	/**
	 * Get status changes for a specific time period
	 */
	async getStatusChangesByDateRange(
		startDate: string,
		endDate: string,
	): Promise<StatusHistoryEntry[]> {
		try {
			const result = await this.db
				.prepare(
					'SELECT * FROM status_history WHERE changed_at BETWEEN ? AND ? ORDER BY changed_at DESC',
				)
				.bind(startDate, endDate)
				.all<StatusHistoryEntry>()

			return result.results || []
		} catch (error) {
			console.error('Error fetching status changes by date range:', error)
			throw new Error('Failed to fetch status changes by date range')
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
export function createCarDB(env: {
	DB: D1Database
	CAR_UPDATES?: DurableObjectNamespace<any>
}): CarDB {
	return new CarDB(env.DB, env)
}
