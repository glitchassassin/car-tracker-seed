import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Global setup for Playwright tests
 * Loads test data into the local database before running tests
 */
async function globalSetup() {
	console.log('🔧 Setting up test environment...')

	try {
		// Clear existing data and import test data
		const testDataFile = path.join(__dirname, 'test-data.csv')
		const importScript = path.join(__dirname, '..', 'scripts', 'import-cars.js')

		console.log('📥 Loading test data into local database...')

		execSync(`node "${importScript}" "${testDataFile}" --clear`, {
			stdio: 'inherit',
			cwd: path.join(__dirname, '..'),
		})

		console.log('✅ Test data loaded successfully')
	} catch (error) {
		console.error('❌ Failed to load test data:', error)
		throw error
	}
}

export default globalSetup
