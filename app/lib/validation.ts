import { z } from 'zod'

// Schema for car ID validation
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

// Schema for status action validation
export const statusActionSchema = z.object({
	targetStatus: z.enum(['PRE_ARRIVAL', 'REGISTERED', 'ON_DECK', 'DONE']),
	referrerPath: z.string().optional().default('/'),
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
export const carLookupSchema = carIdSchema

// Type exports for use in components
export type CarIdFormData = z.infer<typeof carIdSchema>
export type StatusActionFormData = z.infer<typeof statusActionSchema>
export type SqlQueryFormData = z.infer<typeof sqlQuerySchema>
export type CarLookupFormData = z.infer<typeof carLookupSchema>
