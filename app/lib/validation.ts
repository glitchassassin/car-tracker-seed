import { z } from 'zod'

// Schema for car search validation (supports both ID and license plate)
export const carSearchSchema = z.object({
	searchTerm: z
		.string()
		.min(1, 'Search term is required')
		.transform((val) => val.trim())
		.refine((val) => val.length > 0, {
			message: 'Search term cannot be empty',
		}),
})

// Schema for car ID validation (kept for backward compatibility)
export const carIdSchema = z.object({
	carId: z
		.string()
		.min(1, 'Car ID is required')
		.transform((val) => {
			const parsed = parseInt(val, 10)
			if (isNaN(parsed)) {
				throw new Error('Car ID must be a valid number')
			}
			return parsed
		}),
})

// Schema for car status updates received via WebSocket
export const carStatusUpdateSchema = z.object({
	carId: z.number().int().positive(),
	oldStatus: z.string(),
	newStatus: z.string(),
	timestamp: z.string().datetime(),
})

// Schema for WebSocket message envelope
export const carUpdateMessageSchema = z.object({
	type: z.literal('car_status_update'),
	data: carStatusUpdateSchema,
})

// Schema for status action validation
export const statusActionSchema = z.object({
	targetStatus: z.enum([
		'PRE_ARRIVAL',
		'REGISTERED',
		'ON_DECK',
		'DONE',
		'PICKED_UP',
	]),
	referrerPath: z.string().optional().default('/'),
})

// Schema for car edit validation
export const carEditSchema = z.object({
	make: z
		.string()
		.min(1, 'Make is required')
		.transform((val) => val.trim())
		.refine((val) => val.length > 0, {
			message: 'Make cannot be empty',
		}),
	model: z
		.string()
		.min(1, 'Model is required')
		.transform((val) => val.trim())
		.refine((val) => val.length > 0, {
			message: 'Model cannot be empty',
		}),
	color: z.enum([
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
	]),
	license_plate: z
		.string()
		.min(1, 'License plate is required')
		.transform((val) => val.trim())
		.refine((val) => val.length > 0, {
			message: 'License plate cannot be empty',
		}),
})

// Schema for new car registration validation
export const carCreateSchema = z.object({
	id: z
		.string()
		.min(1, 'Car ID is required')
		.transform((val) => {
			const parsed = parseInt(val.trim(), 10)
			if (isNaN(parsed)) {
				throw new Error('Car ID must be a valid number')
			}
			if (parsed < 0) {
				throw new Error('Car ID must be a positive number')
			}
			return parsed
		}),
	make: z
		.string()
		.min(1, 'Make is required')
		.transform((val) => val.trim())
		.refine((val) => val.length > 0, {
			message: 'Make cannot be empty',
		}),
	model: z
		.string()
		.min(1, 'Model is required')
		.transform((val) => val.trim())
		.refine((val) => val.length > 0, {
			message: 'Model cannot be empty',
		}),
	color: z.enum([
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
	]),
	license_plate: z
		.string()
		.min(1, 'License plate is required')
		.transform((val) => val.trim())
		.refine((val) => val.length > 0, {
			message: 'License plate cannot be empty',
		}),
})

// Schema for SQL query validation (development only)
export const sqlQuerySchema = z.object({
	query: z
		.string()
		.min(1, 'Query is required')
		.refine((query) => query.trim().length > 0, {
			message: 'Query cannot be empty',
		}),
})

// Combined schema for car lookup forms (used in registration, floor, handoff routes)
export const carLookupSchema = carSearchSchema

// Schema for CSV import validation
export const carImportSchema = z.object({
	importMode: z.enum(['append', 'replace']),
	csvFile: z
		.instanceof(File)
		.refine((file) => file.size > 0, {
			message: 'CSV file is required',
		})
		.refine((file) => file.type === 'text/csv' || file.name.endsWith('.csv'), {
			message: 'File must be a CSV',
		})
		.refine((file) => file.size <= 5 * 1024 * 1024, {
			message: 'File size must be less than 5MB',
		}),
})

// Schema for individual CSV row validation
export const csvRowSchema = z.object({
	id: z
		.string()
		.min(1, 'Car ID is required')
		.transform((val) => {
			const parsed = parseInt(val.trim(), 10)
			if (isNaN(parsed)) {
				throw new Error('Car ID must be a valid number')
			}
			if (parsed < 0) {
				throw new Error('Car ID must be a positive number')
			}
			return parsed
		}),
	make: z
		.string()
		.min(1, 'Make is required')
		.transform((val) => val.trim())
		.refine((val) => val.length > 0, {
			message: 'Make cannot be empty',
		}),
	model: z
		.string()
		.min(1, 'Model is required')
		.transform((val) => val.trim())
		.refine((val) => val.length > 0, {
			message: 'Model cannot be empty',
		}),
	color: z
		.string()
		.transform((val) => val.trim().toLowerCase())
		.pipe(
			z.enum([
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
			]),
		),
	license_plate: z
		.string()
		.min(1, 'License plate is required')
		.transform((val) => val.trim())
		.refine((val) => val.length > 0, {
			message: 'License plate cannot be empty',
		}),
})

// Type exports for use in components
export type CarSearchFormData = z.infer<typeof carSearchSchema>
export type CarIdFormData = z.infer<typeof carIdSchema>
export type StatusActionFormData = z.infer<typeof statusActionSchema>
export type CarEditFormData = z.infer<typeof carEditSchema>
export type CarCreateFormData = z.infer<typeof carCreateSchema>
export type SqlQueryFormData = z.infer<typeof sqlQuerySchema>
export type CarLookupFormData = z.infer<typeof carLookupSchema>
export type CarStatusUpdate = z.infer<typeof carStatusUpdateSchema>
export type CarUpdateMessage = z.infer<typeof carUpdateMessageSchema>
export type CarImportFormData = z.infer<typeof carImportSchema>
export type CsvRowData = z.infer<typeof csvRowSchema>
