import type { ActionFunctionArgs } from 'react-router'
import { data } from 'react-router'

export async function action({ request, context }: ActionFunctionArgs) {
	if (import.meta.env.MODE !== 'development') {
		throw new Response('Not Found', { status: 404 })
	}

	const formData = await request.formData()
	const query = formData.get('query')

	if (!query || typeof query !== 'string') {
		return data(
			{ success: false as const, error: 'Missing or invalid query parameter' },
			{
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			},
		)
	}

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
