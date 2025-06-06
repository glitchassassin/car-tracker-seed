#!/usr/bin/env node

/**
 * Generate mock vehicle data for the Car Tracker application
 * Creates realistic car data with makes, models, colors, and license plates
 * Outputs to CSV format for import into the database
 */

import fs from 'fs'

const CAR_MAKES_MODELS = {
	Toyota: [
		'Camry',
		'Corolla',
		'RAV4',
		'Highlander',
		'Prius',
		'Sienna',
		'Tacoma',
	],
	Honda: ['Civic', 'Accord', 'CR-V', 'Pilot', 'HR-V', 'Passport', 'Ridgeline'],
	Ford: ['F-150', 'Escape', 'Explorer', 'Focus', 'Mustang', 'Edge', 'Ranger'],
	Chevrolet: [
		'Silverado',
		'Equinox',
		'Malibu',
		'Tahoe',
		'Impala',
		'Traverse',
		'Camaro',
	],
	Nissan: [
		'Altima',
		'Sentra',
		'Rogue',
		'Pathfinder',
		'Murano',
		'Frontier',
		'Maxima',
	],
	Hyundai: [
		'Elantra',
		'Sonata',
		'Tucson',
		'Santa Fe',
		'Accent',
		'Palisade',
		'Kona',
	],
	Subaru: [
		'Outback',
		'Forester',
		'Impreza',
		'Legacy',
		'Ascent',
		'Crosstrek',
		'WRX',
	],
	Mazda: ['CX-5', 'Mazda3', 'CX-9', 'Mazda6', 'CX-30', 'MX-5 Miata', 'CX-50'],
	Volkswagen: [
		'Jetta',
		'Passat',
		'Tiguan',
		'Atlas',
		'Golf',
		'Beetle',
		'Arteon',
	],
	BMW: ['3 Series', '5 Series', 'X3', 'X5', 'X1', '4 Series', '7 Series'],
}

const COLORS = [
	'White',
	'Black',
	'Silver',
	'Gray',
	'Red',
	'Blue',
	'Green',
	'Brown',
	'Orange',
	'Yellow',
	'Purple',
	'Gold',
	'Beige',
	'Navy',
	'Maroon',
]

const STATES = ['CA', 'TX', 'FL', 'NY', 'PA', 'IL', 'OH', 'GA', 'NC', 'MI']

/**
 * Generate a realistic license plate number
 * Format: ABC1234 or 1ABC234 (varies by state)
 */
function generateLicensePlate() {
	const formats = [
		() => {
			// ABC1234 format
			const letters =
				String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
				String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
				String.fromCharCode(65 + Math.floor(Math.random() * 26))
			const numbers = Math.floor(Math.random() * 10000)
				.toString()
				.padStart(4, '0')
			return letters + numbers
		},
		() => {
			// 1ABC234 format
			const firstNum = Math.floor(Math.random() * 10)
			const letters =
				String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
				String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
				String.fromCharCode(65 + Math.floor(Math.random() * 26))
			const numbers = Math.floor(Math.random() * 1000)
				.toString()
				.padStart(3, '0')
			return firstNum + letters + numbers
		},
	]

	return formats[Math.floor(Math.random() * formats.length)]()
}

/**
 * Generate a single car record
 */
function generateCar(id) {
	const makes = Object.keys(CAR_MAKES_MODELS)
	const make = makes[Math.floor(Math.random() * makes.length)]
	const models = CAR_MAKES_MODELS[make]
	const model = models[Math.floor(Math.random() * models.length)]
	const color = COLORS[Math.floor(Math.random() * COLORS.length)]
	const licensePlate = generateLicensePlate()

	return {
		id,
		make,
		model,
		color,
		license_plate: licensePlate,
	}
}

/**
 * Generate CSV content with header
 */
function generateCSV(numCars = 50) {
	const cars = []
	const usedLicensePlates = new Set()

	// Generate unique cars
	for (let i = 1; i <= numCars; i++) {
		let car
		let attempts = 0

		// Ensure unique license plates
		do {
			car = generateCar(i)
			attempts++
			if (attempts > 100) {
				// Fallback if we can't generate unique plates
				car.license_plate = `${car.license_plate}${i}`
				break
			}
		} while (usedLicensePlates.has(car.license_plate))

		usedLicensePlates.add(car.license_plate)
		cars.push(car)
	}

	// Generate CSV content
	const header = 'id,make,model,color,license_plate'
	const rows = cars.map(
		(car) =>
			`${car.id},"${car.make}","${car.model}","${car.color}","${car.license_plate}"`,
	)

	return [header, ...rows].join('\n')
}

/**
 * Main function
 */
function main() {
	const args = process.argv.slice(2)
	const numCars = args[0] ? parseInt(args[0]) : 50
	const outputFile = args[1] || 'mock-cars.csv'

	if (isNaN(numCars) || numCars <= 0) {
		console.error('Error: Number of cars must be a positive integer')
		process.exit(1)
	}

	console.log(`Generating ${numCars} mock car records...`)

	const csvContent = generateCSV(numCars)

	fs.writeFileSync(outputFile, csvContent)

	console.log(`✅ Mock data generated successfully!`)
	console.log(`📁 File: ${outputFile}`)
	console.log(`🚗 Cars: ${numCars}`)
	console.log('')
	console.log('Sample data:')
	console.log(csvContent.split('\n').slice(0, 6).join('\n'))
	if (numCars > 5) {
		console.log('...')
	}
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	main()
}
