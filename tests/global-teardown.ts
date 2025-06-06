import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Global teardown for Playwright tests
 * Cleans up test data from the local database after running tests
 */
async function globalTeardown() {
	console.log('🧹 Cleaning up test environment...')

	try {
		// Clear test data from database
		console.log('🗑️  Removing test data from local database...')

		execSync(
			'npx wrangler d1 execute car-tracker-db --local --command="DELETE FROM cars;"',
			{
				stdio: 'inherit',
				cwd: path.join(__dirname, '..'),
			},
		)

		console.log('✅ Test data cleaned up successfully')
	} catch (error) {
		console.error('❌ Failed to clean up test data:', error)
		// Don't throw error in teardown to avoid masking test failures
	}
}

export default globalTeardown
