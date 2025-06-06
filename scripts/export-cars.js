#!/usr/bin/env node

/**
 * Export car data from D1 database to CSV format
 * Can be used for backup or data analysis
 * Works with both local development and remote databases
 */

import { execSync } from 'child_process'
import fs from 'fs'

/**
 * Convert database query result to CSV format
 */
function convertToCSV(cars) {
	if (!cars || cars.length === 0) {
		return 'id,make,model,color,license_plate\n'
	}

	const header = 'id,make,model,color,license_plate'
	const rows = cars.map((car) => {
		// Escape quotes and wrap fields in quotes if they contain commas
		const escapeField = (field) => {
			const str = String(field || '')
			if (str.includes(',') || str.includes('"') || str.includes('\n')) {
				return `"${str.replace(/"/g, '""')}"`
			}
			return str
		}

		return [
			car.id,
			escapeField(car.make),
			escapeField(car.model),
			escapeField(car.color),
			escapeField(car.license_plate),
		].join(',')
	})

	return [header, ...rows].join('\n') + '\n'
}

/**
 * Execute D1 query and parse JSON result
 */
function queryDatabase(remote = false) {
	const sql =
		'SELECT id, make, model, color, license_plate, status, created_at, registered_at, on_deck_at, completed_at FROM cars ORDER BY id'

	try {
		console.log(`🔍 Querying ${remote ? 'remote' : 'local'} database...`)

		const output = execSync(
			`npx wrangler d1 execute car-tracker-db ${remote ? '--remote' : '--local'} --command="${sql}" --json`,
			{
				stdio: 'pipe',
				encoding: 'utf8',
			},
		)

		// Parse the JSON output
		const jsonOutput = JSON.parse(output)

		// D1 returns an array with one result object
		const result = Array.isArray(jsonOutput) ? jsonOutput[0] : jsonOutput

		if (!result.success) {
			throw new Error(
				`Database query failed: ${result.error || 'Unknown error'}`,
			)
		}

		return result.results || []
	} catch (error) {
		if (error.message.includes('no such table')) {
			throw new Error('Database not initialized. Run migrations first.')
		}
		throw error
	}
}

/**
 * Export cars to CSV file
 */
async function exportCars(outputFile, options = {}) {
	const { remote = false, includeStatus = false } = options

	console.log(
		`📤 Exporting car data from ${remote ? 'remote' : 'local'} database...`,
	)

	const cars = queryDatabase(remote)

	if (cars.length === 0) {
		console.log('ℹ️  No cars found in database')

		// Create empty CSV file with headers
		const emptyCSV = 'id,make,model,color,license_plate\n'
		fs.writeFileSync(outputFile, emptyCSV)

		console.log(`📁 Empty CSV file created: ${outputFile}`)
		return
	}

	console.log(`✅ Found ${cars.length} car records`)

	let csvContent

	if (includeStatus) {
		// Include status and timestamp information
		const header =
			'id,make,model,color,license_plate,status,created_at,registered_at,on_deck_at,completed_at'
		const rows = cars.map((car) => {
			const escapeField = (field) => {
				const str = String(field || '')
				if (str.includes(',') || str.includes('"') || str.includes('\n')) {
					return `"${str.replace(/"/g, '""')}"`
				}
				return str
			}

			return [
				car.id,
				escapeField(car.make),
				escapeField(car.model),
				escapeField(car.color),
				escapeField(car.license_plate),
				escapeField(car.status || 'PRE_ARRIVAL'),
				escapeField(car.created_at || ''),
				escapeField(car.registered_at || ''),
				escapeField(car.on_deck_at || ''),
				escapeField(car.completed_at || ''),
			].join(',')
		})

		csvContent = [header, ...rows].join('\n') + '\n'
	} else {
		// Basic CSV format for import
		csvContent = convertToCSV(cars)
	}

	fs.writeFileSync(outputFile, csvContent)

	console.log('✅ Export completed successfully!')
	console.log(`📁 File: ${outputFile}`)
	console.log(`🚗 Cars: ${cars.length}`)

	// Show sample of exported data
	console.log('\n📋 Sample exported data:')
	cars.slice(0, 5).forEach((car) => {
		console.log(
			`  ${car.id}: ${car.make} ${car.model} (${car.color}) - ${car.license_plate}${car.status ? ` [${car.status}]` : ''}`,
		)
	})
	if (cars.length > 5) {
		console.log('  ...')
	}

	// Show status summary if available
	if (includeStatus && cars.some((car) => car.status)) {
		console.log('\n📊 Status Summary:')
		const statusCounts = cars.reduce((acc, car) => {
			const status = car.status || 'PRE_ARRIVAL'
			acc[status] = (acc[status] || 0) + 1
			return acc
		}, {})

		Object.entries(statusCounts).forEach(([status, count]) => {
			console.log(`  ${status}: ${count}`)
		})
	}
}

/**
 * Main function
 */
async function main() {
	const args = process.argv.slice(2)

	if (args.includes('--help') || args.includes('-h')) {
		console.log(`
Usage: node export-cars.js [output-file] [options]

Arguments:
  output-file     Output CSV file name (default: cars-export.csv)

Options:
  --remote        Export from remote database (default: local)
  --include-status Include status and timestamp columns
  --help, -h      Show this help message

Examples:
  node export-cars.js
  node export-cars.js backup.csv
  node export-cars.js backup.csv --remote
  node export-cars.js backup.csv --include-status
`)
		return
	}

	const outputFile =
		args.find((arg) => !arg.startsWith('--')) || 'cars-export.csv'
	const remote = args.includes('--remote')
	const includeStatus = args.includes('--include-status')

	try {
		await exportCars(outputFile, { remote, includeStatus })
	} catch (error) {
		console.error('❌ Export failed:')
		console.error(error.message)
		process.exit(1)
	}
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch(console.error)
}
