import type { Page } from '@playwright/test'

export interface SQLResult {
	success: boolean
	results?: any[]
	meta?: any
	error?: string
}

/**
 * Execute a raw SQL query against the test database
 * Only works in development mode
 */
export async function executeSQL(
	page: Page,
	query: string,
): Promise<SQLResult> {
	const response = await page.request.post('/test-hooks/sql', {
		form: {
			query,
		},
	})

	const result = await response.json()

	if (!response.ok()) {
		throw new Error(`SQL query failed: ${result.error || 'Unknown error'}`)
	}

	return result
}

/**
 * Execute multiple SQL queries in sequence
 */
export async function executeSQLBatch(
	page: Page,
	queries: string[],
): Promise<SQLResult[]> {
	const results: SQLResult[] = []

	for (const query of queries) {
		const result = await executeSQL(page, query)
		results.push(result)
	}

	return results
}
