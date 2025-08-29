import {
	getFormProps,
	getInputProps,
	getSelectProps,
	useForm,
} from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { Form, Link, redirect } from 'react-router'
import { VALID_CAR_COLORS } from '../lib/car-db'
import { carEditSchema } from '../lib/validation'
import type { Route } from './+types/admin.$carId.edit'

export function meta() {
	return [
		{ title: 'Edit Car Details - Car Tracker' },
		{
			name: 'description',
			content: 'Edit car make, model, color, and license plate',
		},
	]
}

export async function loader({ context, params }: Route.LoaderArgs) {
	const carId = parseInt(params.carId, 10)

	if (isNaN(carId)) {
		throw new Error('Invalid car ID')
	}

	const car = await context.carDB.getCarById(carId)
	if (!car) {
		throw new Error('Car not found')
	}

	return { car }
}

export async function action({ context, params, request }: Route.ActionArgs) {
	const carId = parseInt(params.carId, 10)
	const formData = await request.formData()
	const submission = parseWithZod(formData, { schema: carEditSchema })

	if (submission.status !== 'success') {
		return submission.reply()
	}

	const { make, model, color, license_plate } = submission.value

	try {
		// Update car details
		const updatedCar = await context.carDB.updateCarDetails(carId, {
			make,
			model,
			color,
			license_plate,
		})

		if (!updatedCar) {
			throw new Error('Car not found')
		}

		// Redirect back to admin car view
		return redirect(`/admin/${carId}`)
	} catch {
		return submission.reply({
			formErrors: ['Failed to update car details. Please try again.'],
		})
	}
}

export default function AdminCarEdit({ loaderData }: Route.ComponentProps) {
	const { car } = loaderData
	const [form, fields] = useForm({
		id: 'car-edit',
		defaultValue: {
			make: car.make,
			model: car.model,
			color: car.color,
			license_plate: car.license_plate,
		},
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: carEditSchema })
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
							to={`/admin/${car.id}`}
							className="inline-flex items-center rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
						>
							← Back to Car Details
						</Link>
					</div>
					<h1 className="mb-2 text-3xl font-bold text-gray-900">
						Edit Car #{car.id}
					</h1>
					<p className="text-gray-600">
						Update car details: make, model, color, and license plate
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

						{/* Make Field */}
						<div>
							<label
								htmlFor={fields.make.id}
								className="block text-sm font-medium text-gray-700"
							>
								Make
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
								Model
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
								Color
							</label>
							<div className="mt-1">
								<select
									{...getSelectProps(fields.color)}
									className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
								>
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
								License Plate
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

						{/* Submit Button */}
						<div className="flex justify-end space-x-3">
							<Link
								to={`/admin/${car.id}`}
								className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
							>
								Cancel
							</Link>
							<button
								type="submit"
								className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
							>
								Save Changes
							</button>
						</div>
					</Form>
				</section>
			</div>
		</main>
	)
}
