#!/usr/bin/env node

/**
 * Import car data from CSV into D1 database
 * Validates data format and handles errors gracefully
 * Can be used for both local development and remote databases
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

/**
 * Parse CSV content into car objects
 */
function parseCSV(csvContent) {
	const lines = csvContent.trim().split('\n')

	if (lines.length === 0) {
		throw new Error('CSV file is empty')
	}

	const header = lines[0].toLowerCase().replace(/"/g, '')
	const expectedHeader = 'id,make,model,color,license_plate'

	if (header !== expectedHeader) {
		throw new Error(
			`Invalid CSV header. Expected: ${expectedHeader}, Got: ${header}`,
		)
	}

	const cars = []
	const errors = []

	for (let i = 1; i < lines.length; i++) {
		const line = lines[i].trim()
		if (!line) continue // Skip empty lines

		try {
			const car = parseCSVLine(line, i + 1)
			if (car) {
				cars.push(car)
			}
		} catch (error) {
			errors.push(`Line ${i + 1}: ${error.message}`)
		}
	}

	if (errors.length > 0) {
		throw new Error(`CSV parsing errors:\n${errors.join('\n')}`)
	}

	return cars
}

/**
 * Parse a single CSV line into a car object
 */
function parseCSVLine(line, lineNumber) {
	// Simple CSV parser that handles quoted fields
	const fields = []
	let current = ''
	let inQuotes = false

	for (let i = 0; i < line.length; i++) {
		const char = line[i]

		if (char === '"') {
			inQuotes = !inQuotes
		} else if (char === ',' && !inQuotes) {
			fields.push(current.trim())
			current = ''
		} else {
			current += char
		}
	}
	fields.push(current.trim())

	if (fields.length !== 5) {
		throw new Error(`Expected 5 fields, got ${fields.length}`)
	}

	const [id, make, model, color, licensePlate] = fields.map(
		(field) => field.replace(/^"(.*)"$/, '$1'), // Remove surrounding quotes
	)

	// Validate required fields
	if (!id || !make || !model || !color || !licensePlate) {
		throw new Error(
			'All fields are required (id, make, model, color, license_plate)',
		)
	}

	// Validate ID is a number
	const numId = parseInt(id)
	if (isNaN(numId) || numId <= 0) {
		throw new Error(`Invalid ID: ${id}. Must be a positive integer.`)
	}

	// Validate field lengths (prevent database issues)
	if (make.length > 50) throw new Error(`Make too long: ${make}`)
	if (model.length > 50) throw new Error(`Model too long: ${model}`)
	if (color.length > 30) throw new Error(`Color too long: ${color}`)
	if (licensePlate.length > 20)
		throw new Error(`License plate too long: ${licensePlate}`)

	return {
		id: numId,
		make: make.trim(),
		model: model.trim(),
		color: color.trim(),
		license_plate: licensePlate.trim(),
	}
}

/**
 * Generate SQL INSERT statements
 */
function generateInsertSQL(cars) {
	if (cars.length === 0) {
		return ''
	}

	const values = cars
		.map(
			(car) =>
				`(${car.id}, '${car.make.replace(/'/g, "''")}', '${car.model.replace(/'/g, "''")}', '${car.color.replace(/'/g, "''")}', '${car.license_plate.replace(/'/g, "''")}')`,
		)
		.join(',\n    ')

	return `INSERT INTO cars (id, make, model, color, license_plate) VALUES
    ${values};`
}

/**
 * Import cars into D1 database
 */
async function importCars(csvFile, options = {}) {
	const { remote = false, clear = false } = options

	console.log(`📖 Reading CSV file: ${csvFile}`)

	if (!fs.existsSync(csvFile)) {
		throw new Error(`File not found: ${csvFile}`)
	}

	const csvContent = fs.readFileSync(csvFile, 'utf8')

	console.log('🔍 Parsing CSV data...')
	const cars = parseCSV(csvContent)

	console.log(`✅ Parsed ${cars.length} car records`)

	if (clear) {
		console.log('🗑️  Clearing existing data...')
		const clearSQL = 'DELETE FROM cars;'

		try {
			execSync(
				`npx wrangler d1 execute car-tracker-db ${remote ? '--remote' : '--local'} --command="${clearSQL}"`,
				{
					stdio: 'pipe',
					encoding: 'utf8',
				},
			)
			console.log('✅ Existing data cleared')
		} catch (error) {
			console.warn('⚠️  Could not clear existing data (table might be empty)')
		}
	}

	if (cars.length === 0) {
		console.log('ℹ️  No cars to import')
		return
	}

	console.log(
		`📥 Importing ${cars.length} cars into ${remote ? 'remote' : 'local'} database...`,
	)

	// Create temporary SQL file
	const sqlContent = generateInsertSQL(cars)
	const tempSQLFile = path.join(process.cwd(), 'temp-import.sql')

	try {
		fs.writeFileSync(tempSQLFile, sqlContent)

		// Execute import
		const output = execSync(
			`npx wrangler d1 execute car-tracker-db ${remote ? '--remote' : '--local'} --file="${tempSQLFile}"`,
			{
				stdio: 'pipe',
				encoding: 'utf8',
			},
		)

		console.log('✅ Import completed successfully!')
		console.log(`🚗 Imported ${cars.length} cars`)

		// Show sample of imported data
		console.log('\n📋 Sample imported data:')
		cars.slice(0, 5).forEach((car) => {
			console.log(
				`  ${car.id}: ${car.make} ${car.model} (${car.color}) - ${car.license_plate}`,
			)
		})
		if (cars.length > 5) {
			console.log('  ...')
		}
	} finally {
		// Clean up temp file
		if (fs.existsSync(tempSQLFile)) {
			fs.unlinkSync(tempSQLFile)
		}
	}
}

/**
 * Main function
 */
async function main() {
	const args = process.argv.slice(2)

	if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
		console.log(`
Usage: node import-cars.js <csv-file> [options]

Options:
  --remote    Import to remote database (default: local)
  --clear     Clear existing data before import
  --help, -h  Show this help message

Examples:
  node import-cars.js mock-cars.csv
  node import-cars.js mock-cars.csv --clear
  node import-cars.js mock-cars.csv --remote --clear
`)
		return
	}

	const csvFile = args[0]
	const remote = args.includes('--remote')
	const clear = args.includes('--clear')

	try {
		await importCars(csvFile, { remote, clear })
	} catch (error) {
		console.error('❌ Import failed:')
		console.error(error.message)
		process.exit(1)
	}
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch(console.error)
}
