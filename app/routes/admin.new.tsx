import {
	getFormProps,
	getInputProps,
	getSelectProps,
	useForm,
} from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { Form, Link, redirect } from 'react-router'
import { VALID_CAR_COLORS } from '../lib/car-db'
import { carCreateSchema } from '../lib/validation'
import type { Route } from './+types/admin.new'

export function meta() {
	return [
		{ title: 'Register New Car - Car Tracker' },
		{
			name: 'description',
			content: 'Register a new car with manual ID entry',
		},
	]
}

export async function action({ context, request }: Route.ActionArgs) {
	const formData = await request.formData()
	const submission = parseWithZod(formData, { schema: carCreateSchema })

	if (submission.status !== 'success') {
		return submission.reply()
	}

	const { id, make, model, color, license_plate } = submission.value

	try {
		// Create the new car
		const newCar = await context.carDB.createCar({
			id,
			make,
			model,
			color,
			license_plate,
		})

		// Redirect to the new car's admin view
		return redirect(`/admin/${newCar.id}`)
	} catch (error) {
		// Handle ID conflict specifically
		if (error instanceof Error && error.message.includes('already exists')) {
			return submission.reply({
				formErrors: [
					`Car with ID ${id} already exists. Please use a different ID.`,
				],
			})
		}

		return submission.reply({
			formErrors: ['Failed to register car. Please try again.'],
		})
	}
}

export default function AdminNewCar({ actionData }: Route.ComponentProps) {
	const [form, fields] = useForm({
		id: 'car-create',
		lastResult: actionData,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: carCreateSchema })
		},
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onInput',
	})

	return (
		<main className="min-h-screen p-4">
			<div className="mx-auto max-w-2xl space-y-8">
				<header className="text-center">
					<div className="mb-4 flex justify-start">
						<Link
							to="/admin"
							className="inline-flex items-center rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
						>
							← Back to Admin Dashboard
						</Link>
					</div>
					<h1 className="mb-2 text-3xl font-bold text-gray-900">
						Register New Car
					</h1>
					<p className="text-gray-600">
						Enter car details including a unique ID number
					</p>
				</header>

				<section className="rounded-lg border border-gray-200 bg-white p-6">
					<Form method="post" {...getFormProps(form)} className="space-y-6">
						{/* Form Errors */}
						{form.errors && (
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
											There were errors with your submission
										</h3>
										<div className="mt-2 text-sm text-red-700">
											<ul className="list-disc space-y-1 pl-5">
												{form.errors.map((error, index) => (
													<li key={index}>{error}</li>
												))}
											</ul>
										</div>
									</div>
								</div>
							</div>
						)}

						{/* Car ID Field */}
						<div>
							<label
								htmlFor={fields.id.id}
								className="block text-sm font-medium text-gray-700"
							>
								Car ID <span className="text-red-500">*</span>
							</label>
							<div className="mt-1">
								<input
									{...getInputProps(fields.id, { type: 'text' })}
									className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
									placeholder="e.g., 123"
								/>
								{fields.id.errors && (
									<p className="mt-2 text-sm text-red-600">
										{fields.id.errors[0]}
									</p>
								)}
							</div>
							<p className="mt-1 text-sm text-gray-500">
								Enter a unique numeric ID for this car
							</p>
						</div>

						{/* Make Field */}
						<div>
							<label
								htmlFor={fields.make.id}
								className="block text-sm font-medium text-gray-700"
							>
								Make <span className="text-red-500">*</span>
							</label>
							<div className="mt-1">
								<input
									{...getInputProps(fields.make, { type: 'text' })}
									className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
									placeholder="e.g., Toyota"
								/>
								{fields.make.errors && (
									<p className="mt-2 text-sm text-red-600">
										{fields.make.errors[0]}
									</p>
								)}
							</div>
						</div>

						{/* Model Field */}
						<div>
							<label
								htmlFor={fields.model.id}
								className="block text-sm font-medium text-gray-700"
							>
								Model <span className="text-red-500">*</span>
							</label>
							<div className="mt-1">
								<input
									{...getInputProps(fields.model, { type: 'text' })}
									className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
									placeholder="e.g., Camry"
								/>
								{fields.model.errors && (
									<p className="mt-2 text-sm text-red-600">
										{fields.model.errors[0]}
									</p>
								)}
							</div>
						</div>

						{/* Color Field */}
						<div>
							<label
								htmlFor={fields.color.id}
								className="block text-sm font-medium text-gray-700"
							>
								Color <span className="text-red-500">*</span>
							</label>
							<div className="mt-1">
								<select
									{...getSelectProps(fields.color)}
									className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
								>
									<option value="">Select a color</option>
									{VALID_CAR_COLORS.map((color) => (
										<option key={color} value={color}>
											{color.charAt(0).toUpperCase() + color.slice(1)}
										</option>
									))}
								</select>
								{fields.color.errors && (
									<p className="mt-2 text-sm text-red-600">
										{fields.color.errors[0]}
									</p>
								)}
							</div>
						</div>

						{/* License Plate Field */}
						<div>
							<label
								htmlFor={fields.license_plate.id}
								className="block text-sm font-medium text-gray-700"
							>
								License Plate <span className="text-red-500">*</span>
							</label>
							<div className="mt-1">
								<input
									{...getInputProps(fields.license_plate, { type: 'text' })}
									className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
									placeholder="e.g., ABC123"
								/>
								{fields.license_plate.errors && (
									<p className="mt-2 text-sm text-red-600">
										{fields.license_plate.errors[0]}
									</p>
								)}
							</div>
						</div>

						{/* Additional Info */}
						<div className="rounded-lg bg-blue-50 p-4">
							<div className="flex">
								<div className="flex-shrink-0">
									<svg
										className="h-5 w-5 text-blue-400"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											fillRule="evenodd"
											d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
											clipRule="evenodd"
										/>
									</svg>
								</div>
								<div className="ml-3">
									<h3 className="text-sm font-medium text-blue-800">
										New Car Information
									</h3>
									<div className="mt-2 text-sm text-blue-700">
										<p>
											New cars will be created with "Pre-Arrival" status and
											will appear in the registration queue.
										</p>
									</div>
								</div>
							</div>
						</div>

						{/* Submit Button */}
						<div className="flex justify-end space-x-3">
							<Link
								to="/admin"
								className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
							>
								Cancel
							</Link>
							<button
								type="submit"
								className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
							>
								Register Car
							</button>
						</div>
					</Form>
				</section>
			</div>
		</main>
	)
}
