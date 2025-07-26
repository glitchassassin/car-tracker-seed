import { parseWithZod } from '@conform-to/zod'
import type { ActionFunctionArgs } from 'react-router'
import { data } from 'react-router'
import { sqlQuerySchema } from '../lib/validation'

export async function action({ request, context }: ActionFunctionArgs) {
	if (import.meta.env.MODE !== 'development') {
		throw new Response('Not Found', { status: 404 })
	}

	const formData = await request.formData()
	const submission = parseWithZod(formData, { schema: sqlQuerySchema })

	if (submission.status !== 'success') {
		return data(
			{
				success: false as const,
				error: submission.error?.query?.[0] || 'Invalid query parameter',
			},
			{
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			},
		)
	}

	const { query } = submission.value

	try {
		// Execute the raw SQL query
		const result = await (context as any).cloudflare.env.DB.prepare(query).all()

		return {
			success: true as const,
			results: result.results,
			meta: result.meta,
		}
	} catch (error) {
		console.error('SQL execution error:', error)
		return data(
			{
				success: false as const,
				error: error instanceof Error ? error.message : 'Unknown error',
			},
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			},
		)
	}
}

// Resource routes don't export a default component
// They only handle actions/loaders and return responses
