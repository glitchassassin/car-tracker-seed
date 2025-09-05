import { parseWithZod } from '@conform-to/zod'
import { parse } from 'csv-parse/browser/esm'
import { Link, redirect } from 'react-router'
import type { Route } from './+types/admin.upload'
import type { CarInput } from '~/lib/car-db'
import { carImportSchema, csvRowSchema } from '~/lib/validation'

export function meta({}: Route.MetaArgs) {
	return [
		{ title: 'Import Cars - Admin Dashboard' },
		{
			name: 'description',
			content: 'Import cars from CSV file',
		},
	]
}

export async function action({ request, context }: Route.ActionArgs) {
	const formData = await request.formData()

	const submission = parseWithZod(formData, { schema: carImportSchema })

	if (submission.status !== 'success') {
		return submission.reply()
	}

	const { importMode: mode, csvFile } = submission.value

	try {
		// Parse CSV file using streaming approach for Cloudflare Workers compatibility
		const parseResult = await parseCSVStream(csvFile)

		if (!parseResult.success) {
			return submission.reply({
				formErrors: parseResult.errors,
			})
		}

		// Import cars using the database transaction
		const importResult = await context.carDB.importCars(
			parseResult.cars,
			mode as 'append' | 'replace',
		)

		if (!importResult.success) {
			return submission.reply({
				formErrors: importResult.errors,
			})
		}

		// Prepare success/warning messages
		const messages: string[] = []
		if (parseResult.validRowCount > 0) {
			messages.push(`Successfully imported ${importResult.imported} cars`)
		}
		if (parseResult.invalidRowCount > 0) {
			messages.push(
				`${parseResult.invalidRowCount} rows had validation errors and were skipped`,
			)
		}

		// If there were validation errors, show them instead of redirecting
		if (parseResult.errors.length > 0) {
			return submission.reply({
				formErrors: [
					...messages,
					'',
					'Validation errors:',
					...parseResult.errors,
				],
			})
		}

		// Redirect to admin page with success message (no validation errors)
		const url = new URL('/admin', request.url)
		url.searchParams.set('imported', importResult.imported.toString())
		url.searchParams.set('mode', mode)

		return redirect(url.toString())
	} catch (error) {
		console.error('Import error:', error)
		const errorMessage =
			error instanceof Error ? error.message : 'Unknown error'
		return submission.reply({
			formErrors: [`Import failed: ${errorMessage}`],
		})
	}
}

async function parseCSVStream(csvFile: File): Promise<{
	success: boolean
	cars: CarInput[]
	errors: string[]
	validRowCount: number
	invalidRowCount: number
}> {
	const errors: string[] = []
	const cars: CarInput[] = []
	const requiredHeaders = ['id', 'make', 'model', 'color', 'license_plate']
	let headersValidated = false
	let rowIndex = 0

	return new Promise((resolve) => {
		try {
			// Create the CSV parser with streaming configuration
			const parser = parse({
				columns: true, // Use first row as column headers
				skip_empty_lines: true,
				trim: true,
				cast: false, // Keep all values as strings for validation
			})

			// Handle parsed records
			parser.on('readable', function () {
				let record: Record<string, string>
				while ((record = parser.read()) !== null) {
					// Validate headers on first record
					if (!headersValidated) {
						const headers = Object.keys(record).map((h) => h.toLowerCase())
						const missingHeaders = requiredHeaders.filter(
							(header) => !headers.includes(header.toLowerCase()),
						)

						if (missingHeaders.length > 0) {
							resolve({
								success: false,
								cars: [],
								errors: [
									`Missing required headers: ${missingHeaders.join(', ')}. Expected headers: ${requiredHeaders.join(', ')}`,
								],
								validRowCount: 0,
								invalidRowCount: 0,
							})
							return
						}
						headersValidated = true
					}

					// Process the record
					try {
						// Create a case-insensitive mapping of the record
						const normalizedRecord: Record<string, string> = {}
						Object.entries(record).forEach(([key, value]) => {
							normalizedRecord[key.toLowerCase()] = (value || '')
								.toString()
								.trim()
						})

						const rowData = {
							id: normalizedRecord.id || '',
							make: normalizedRecord.make || '',
							model: normalizedRecord.model || '',
							color: normalizedRecord.color || '',
							license_plate: normalizedRecord.license_plate || '',
						}

						const validationResult = csvRowSchema.safeParse(rowData)

						if (!validationResult.success) {
							const fieldErrors = validationResult.error.errors
								.map((err) => {
									const path =
										err.path?.length > 0 ? err.path.join('.') : 'unknown field'
									const message = err.message || 'validation error'
									return `${path}: ${message}`
								})
								.filter(Boolean) // Remove any undefined/null values
								.join(', ')
							if (fieldErrors.trim()) {
								errors.push(`Row ${rowIndex + 2}: ${fieldErrors}`) // +2 because index is 0-based and we skip header
							}
						} else {
							cars.push(validationResult.data)
						}
					} catch (error) {
						const errorMessage =
							error instanceof Error ? error.message : 'Unknown error'
						errors.push(`Row ${rowIndex + 2}: ${errorMessage}`)
					}

					rowIndex++
				}
			})

			// Handle parser completion
			parser.on('end', function () {
				const validRowCount = cars.length
				const invalidRowCount = errors.length

				if (validRowCount === 0) {
					resolve({
						success: false,
						cars: [],
						errors:
							errors.length > 0 ? errors : ['No valid car data found in CSV'],
						validRowCount: 0,
						invalidRowCount,
					})
				} else {
					// Success if we have valid cars, even if some rows failed
					resolve({
						success: true,
						cars,
						errors,
						validRowCount,
						invalidRowCount,
					})
				}
			})

			// Handle parser errors
			parser.on('error', function (err) {
				resolve({
					success: false,
					cars: [],
					errors: [`Failed to parse CSV: ${err.message}`],
					validRowCount: 0,
					invalidRowCount: 0,
				})
			})

			// Stream the file data into the parser
			const stream = csvFile.stream()
			const reader = stream.getReader()
			const decoder = new TextDecoder()

			const pump = async (): Promise<void> => {
				try {
					while (true) {
						const { done, value } = await reader.read()
						if (done) {
							parser.end()
							break
						}

						// Decode the chunk and write to parser
						const chunk = decoder.decode(value, { stream: true })
						const canContinue = parser.write(chunk)

						// Handle backpressure - wait for drain event if parser is busy
						if (!canContinue) {
							await new Promise<void>((resolveDrain) => {
								parser.once('drain', resolveDrain)
							})
						}
					}
				} catch (streamError) {
					parser.destroy(streamError as Error)
				}
			}

			// Start pumping data
			pump().catch((pumpError) => {
				resolve({
					success: false,
					cars: [],
					errors: [
						`Failed to process CSV stream: ${pumpError instanceof Error ? pumpError.message : 'Unknown error'}`,
					],
					validRowCount: 0,
					invalidRowCount: 0,
				})
			})
		} catch (error) {
			resolve({
				success: false,
				cars: [],
				errors: [
					`Failed to initialize CSV parser: ${error instanceof Error ? error.message : 'Unknown error'}`,
				],
				validRowCount: 0,
				invalidRowCount: 0,
			})
		}
	})
}

export default function AdminImport({ actionData }: Route.ComponentProps) {
	return (
		<main className="min-h-screen p-4">
			<div className="mx-auto max-w-4xl space-y-6">
				{/* Header */}
				<header className="text-center">
					<div className="mb-4 flex justify-between">
						<Link
							to="/admin"
							className="inline-flex items-center rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
						>
							← Back to Admin
						</Link>
					</div>
					<h1 className="mb-2 text-3xl font-bold text-gray-900">
						Import Cars from CSV
					</h1>
					<p className="text-gray-600">
						Upload a CSV file to import multiple cars at once
					</p>
				</header>

				{/* Instructions */}
				<div className="rounded-lg bg-blue-50 p-6">
					<h2 className="mb-3 text-lg font-semibold text-blue-900">
						CSV Format Requirements
					</h2>
					<div className="space-y-3 text-sm text-blue-800">
						<p>
							Your CSV file must include the following columns (in any order):
						</p>
						<ul className="list-disc space-y-1 pl-6">
							<li>
								<strong>id</strong> - Unique car ID (positive number)
							</li>
							<li>
								<strong>make</strong> - Car manufacturer (e.g., Toyota, Ford)
							</li>
							<li>
								<strong>model</strong> - Car model (e.g., Camry, F-150)
							</li>
							<li>
								<strong>color</strong> - One of: white, black, gray, silver,
								blue, red, green, brown, orange, gold, purple, yellow
							</li>
							<li>
								<strong>license_plate</strong> - License plate number
							</li>
						</ul>
						<div className="mt-4 rounded bg-blue-100 p-3">
							<p className="font-medium">Example CSV format:</p>
							<code className="mt-2 block font-mono text-xs">
								id,make,model,color,license_plate
								<br />
								1,Toyota,Camry,blue,ABC123
								<br />
								2,Ford,F-150,red,DEF456
								<br />
								3,Honda,Civic,white,GHI789
							</code>
						</div>
					</div>
				</div>

				{/* Import Form */}
				<div className="rounded-lg bg-white p-6 shadow-lg">
					<form
						method="post"
						encType="multipart/form-data"
						className="space-y-6"
					>
						{/* File Upload */}
						<div>
							<label
								htmlFor="csvFile"
								className="mb-2 block text-sm font-medium text-gray-700"
							>
								CSV File
							</label>
							<input
								type="file"
								id="csvFile"
								name="csvFile"
								accept=".csv,text/csv"
								required
								className="block w-full rounded-lg border border-gray-300 text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
							/>
							<p className="mt-1 text-xs text-gray-500">
								Maximum file size: 5MB
							</p>
						</div>

						{/* Import Mode */}
						<div>
							<label className="mb-3 block text-sm font-medium text-gray-700">
								Import Mode
							</label>
							<div className="space-y-3">
								<label className="flex items-start space-x-3">
									<input
										type="radio"
										name="importMode"
										value="append"
										defaultChecked
										className="mt-1 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
									/>
									<div>
										<div className="text-sm font-medium text-gray-900">
											Append to existing cars
										</div>
										<div className="text-xs text-gray-500">
											Add new cars while keeping existing ones. Import will fail
											if any car IDs already exist.
										</div>
									</div>
								</label>
								<label className="flex items-start space-x-3">
									<input
										type="radio"
										name="importMode"
										value="replace"
										className="mt-1 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
									/>
									<div>
										<div className="text-sm font-medium text-gray-900">
											Replace all cars
										</div>
										<div className="text-xs text-gray-500">
											⚠️ Delete all existing cars and import the new list. This
											action cannot be undone.
										</div>
									</div>
								</label>
							</div>
						</div>

						{/* Results Display */}
						{actionData?.status === 'error' && actionData.error && (
							<div className="space-y-4">
								{actionData.error[''] && actionData.error[''].length > 0 ? (
									(() => {
										// Separate success messages, warnings, and errors
										const messages = actionData.error['']
										const successMessages = messages.filter(
											(msg: string) =>
												msg &&
												typeof msg === 'string' &&
												msg.includes('Successfully imported'),
										)
										const warningMessages = messages.filter(
											(msg: string) =>
												msg &&
												typeof msg === 'string' &&
												msg.includes('validation errors and were skipped'),
										)
										const errorMessages = messages.filter(
											(msg: string) =>
												msg && // Ensure msg is not undefined/null
												typeof msg === 'string' && // Ensure msg is a string
												!msg.includes('Successfully imported') &&
												!msg.includes('validation errors and were skipped') &&
												msg.trim() !== '' &&
												msg !== 'Validation errors:',
										)
										const validationErrors = messages
											.slice(messages.indexOf('Validation errors:') + 1)
											.filter(Boolean) // Remove any undefined/null values

										return (
											<>
												{/* Success Messages */}
												{successMessages.length > 0 && (
													<div className="rounded-lg bg-green-50 p-4">
														<div className="flex">
															<div className="flex-shrink-0">
																<svg
																	className="h-5 w-5 text-green-400"
																	viewBox="0 0 20 20"
																	fill="currentColor"
																>
																	<path
																		fillRule="evenodd"
																		d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
																		clipRule="evenodd"
																	/>
																</svg>
															</div>
															<div className="ml-3">
																<h3 className="text-sm font-medium text-green-800">
																	Import Completed
																</h3>
																<div className="mt-2 text-sm text-green-700">
																	{successMessages.map(
																		(msg: string, index: number) => (
																			<p key={index}>{msg}</p>
																		),
																	)}
																</div>
															</div>
														</div>
													</div>
												)}

												{/* Warning Messages */}
												{warningMessages.length > 0 && (
													<div className="rounded-lg bg-yellow-50 p-4">
														<div className="flex">
															<div className="flex-shrink-0">
																<svg
																	className="h-5 w-5 text-yellow-400"
																	viewBox="0 0 20 20"
																	fill="currentColor"
																>
																	<path
																		fillRule="evenodd"
																		d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
																		clipRule="evenodd"
																	/>
																</svg>
															</div>
															<div className="ml-3">
																<h3 className="text-sm font-medium text-yellow-800">
																	Partial Import
																</h3>
																<div className="mt-2 text-sm text-yellow-700">
																	{warningMessages.map(
																		(msg: string, index: number) => (
																			<p key={index}>{msg}</p>
																		),
																	)}
																</div>
															</div>
														</div>
													</div>
												)}

												{/* Validation Errors */}
												{validationErrors.length > 0 && (
													<div className="rounded-lg bg-red-50 p-4">
														<div className="flex">
															<div className="flex-shrink-0">
																<svg
																	className="h-5 w-5 text-red-400"
																	viewBox="0 0 20 20"
																	fill="currentColor"
																>
																	<path
																		fillRule="evenodd"
																		d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
																		clipRule="evenodd"
																	/>
																</svg>
															</div>
															<div className="ml-3">
																<h3 className="text-sm font-medium text-red-800">
																	Validation Errors
																</h3>
																<div className="mt-2 text-sm text-red-700">
																	<p className="mb-2">
																		The following rows could not be imported:
																	</p>
																	<ul className="list-disc space-y-1 pl-5">
																		{validationErrors.map(
																			(error: string, index: number) => (
																				<li
																					key={index}
																					className="font-mono text-xs"
																				>
																					{error}
																				</li>
																			),
																		)}
																	</ul>
																</div>
															</div>
														</div>
													</div>
												)}

												{/* General Error Messages */}
												{errorMessages.length > 0 && (
													<div className="rounded-lg bg-red-50 p-4">
														<div className="flex">
															<div className="flex-shrink-0">
																<svg
																	className="h-5 w-5 text-red-400"
																	viewBox="0 0 20 20"
																	fill="currentColor"
																>
																	<path
																		fillRule="evenodd"
																		d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
																		clipRule="evenodd"
																	/>
																</svg>
															</div>
															<div className="ml-3">
																<h3 className="text-sm font-medium text-red-800">
																	Import Error
																</h3>
																<div className="mt-2 text-sm text-red-700">
																	<ul className="list-disc space-y-1 pl-5">
																		{errorMessages.map(
																			(error: string, index: number) => (
																				<li key={index}>{error}</li>
																			),
																		)}
																	</ul>
																</div>
															</div>
														</div>
													</div>
												)}
											</>
										)
									})()
								) : actionData.error.fieldErrors ? (
									<div className="rounded-lg bg-red-50 p-4">
										<div className="flex">
											<div className="flex-shrink-0">
												<svg
													className="h-5 w-5 text-red-400"
													viewBox="0 0 20 20"
													fill="currentColor"
												>
													<path
														fillRule="evenodd"
														d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
														clipRule="evenodd"
													/>
												</svg>
											</div>
											<div className="ml-3">
												<h3 className="text-sm font-medium text-red-800">
													Form Error
												</h3>
												<div className="mt-2 text-sm text-red-700">
													<div className="space-y-2">
														{Object.entries(actionData.error.fieldErrors).map(
															([field, errors]) => (
																<div key={field}>
																	<strong className="capitalize">
																		{field}:
																	</strong>{' '}
																	{Array.isArray(errors)
																		? errors.join(', ')
																		: errors}
																</div>
															),
														)}
													</div>
												</div>
											</div>
										</div>
									</div>
								) : (
									<div className="rounded-lg bg-red-50 p-4">
										<div className="flex">
											<div className="flex-shrink-0">
												<svg
													className="h-5 w-5 text-red-400"
													viewBox="0 0 20 20"
													fill="currentColor"
												>
													<path
														fillRule="evenodd"
														d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
														clipRule="evenodd"
													/>
												</svg>
											</div>
											<div className="ml-3">
												<h3 className="text-sm font-medium text-red-800">
													Import Error
												</h3>
												<div className="mt-2 text-sm text-red-700">
													<p>An error occurred during import</p>
												</div>
											</div>
										</div>
									</div>
								)}
							</div>
						)}

						{/* Submit Button */}
						<div className="flex justify-end space-x-3">
							<Link
								to="/admin"
								className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
							>
								Cancel
							</Link>
							<button
								type="submit"
								className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
							>
								Import Cars
							</button>
						</div>
					</form>
				</div>

				{/* Sample Download */}
				<div className="rounded-lg bg-gray-50 p-4">
					<h3 className="mb-2 text-sm font-medium text-gray-900">
						Need a sample CSV file?
					</h3>
					<p className="mb-3 text-xs text-gray-600">
						Download a sample CSV file with the correct format to get started.
					</p>
					<button
						onClick={() => {
							const csvContent = `id,make,model,color,license_plate
1,Toyota,Camry,blue,ABC123
2,Ford,F-150,red,DEF456
3,Honda,Civic,white,GHI789
4,BMW,X5,black,JKL012
5,Audi,A4,silver,MNO345`

							const blob = new Blob([csvContent], { type: 'text/csv' })
							const url = window.URL.createObjectURL(blob)
							const a = document.createElement('a')
							a.href = url
							a.download = 'sample-cars.csv'
							document.body.appendChild(a)
							a.click()
							document.body.removeChild(a)
							window.URL.revokeObjectURL(url)
						}}
						className="inline-flex items-center rounded-lg bg-gray-600 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-gray-700"
					>
						Download Sample CSV
					</button>
				</div>
			</div>
		</main>
	)
}
