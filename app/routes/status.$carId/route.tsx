import { parseWithZod } from '@conform-to/zod'
import { redirect } from 'react-router'
import { createCarDB } from '../../lib/car-db'
import { statusActionSchema } from '../../lib/validation'
import type { Route } from './+types/route'

export function meta({}: Route.MetaArgs) {
	return [
		{ title: 'Car Status - Car Tracker' },
		{ name: 'description', content: 'Manage car status and transitions' },
	]
}

export async function loader({ context, params, request }: Route.LoaderArgs) {
	const carDB = createCarDB(context.cloudflare.env)
	const carId = parseInt(params.carId!, 10)

	if (isNaN(carId)) {
		throw new Error('Invalid car ID')
	}

	const car = await carDB.getCarById(carId)
	if (!car) {
		throw new Error('Car not found')
	}

	// Get referrer to determine back navigation
	const referrer = request.headers.get('referer') || '/'
	const url = new URL(referrer)
	const referrerPath = url.pathname

	return { car, referrerPath }
}

export async function action({ context, params, request }: Route.ActionArgs) {
	const carDB = createCarDB(context.cloudflare.env)
	const carId = parseInt(params.carId!, 10)
	const formData = await request.formData()
	const submission = parseWithZod(formData, { schema: statusActionSchema })

	if (submission.status !== 'success') {
		return submission.reply()
	}

	const { targetStatus, referrerPath } = submission.value

	// Update car status to target status
	await carDB.updateCarStatus(carId, targetStatus)

	// Redirect back to the referrer path
	return redirect(referrerPath)
}

// Helper function to get status-specific actions
function getStatusActions(carStatus: string) {
	switch (carStatus) {
		case 'PRE_ARRIVAL':
			return {
				primary: {
					targetStatus: 'REGISTERED',
					label: 'Move to Registered',
					className: 'bg-green-700 hover:bg-green-800 text-white',
				},
				secondary: [
					{
						targetStatus: 'ON_DECK',
						label: 'Skip to On Deck',
						className: 'bg-yellow-100 hover:bg-yellow-200 text-gray-700',
					},
					{
						targetStatus: 'DONE',
						label: 'Skip to Done',
						className: 'bg-orange-100 hover:bg-orange-200 text-gray-700',
					},
				],
			}
		case 'REGISTERED':
			return {
				primary: {
					targetStatus: 'ON_DECK',
					label: 'Move to On Deck',
					className: 'bg-blue-700 hover:bg-blue-800 text-white',
				},
				secondary: [
					{
						targetStatus: 'PRE_ARRIVAL',
						label: 'Return to Pre-Arrival',
						className: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
					},
					{
						targetStatus: 'DONE',
						label: 'Skip to Done',
						className: 'bg-orange-100 hover:bg-orange-200 text-gray-700',
					},
				],
			}
		case 'ON_DECK':
			return {
				primary: {
					targetStatus: 'DONE',
					label: 'Move to Done',
					className: 'bg-orange-700 hover:bg-orange-800 text-white',
				},
				secondary: [
					{
						targetStatus: 'PRE_ARRIVAL',
						label: 'Return to Pre-Arrival',
						className: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
					},
					{
						targetStatus: 'REGISTERED',
						label: 'Return to Registered',
						className: 'bg-blue-100 hover:bg-blue-200 text-gray-700',
					},
				],
			}
		case 'DONE':
			return {
				primary: null, // No primary action for DONE status
				secondary: [
					{
						targetStatus: 'PRE_ARRIVAL',
						label: 'Return to Pre-Arrival',
						className: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
					},
					{
						targetStatus: 'REGISTERED',
						label: 'Return to Registered',
						className: 'bg-blue-100 hover:bg-blue-200 text-gray-700',
					},
					{
						targetStatus: 'ON_DECK',
						label: 'Return to On Deck',
						className: 'bg-yellow-100 hover:bg-yellow-200 text-gray-700',
					},
				],
			}
		default:
			return {
				primary: null,
				secondary: [],
			}
	}
}

// Helper function to get status display info
function getStatusDisplayInfo(status: string) {
	switch (status) {
		case 'PRE_ARRIVAL':
			return {
				title: 'Pre-Arrival',
				description: 'Car is waiting to arrive',
				color: 'text-gray-600',
				bgColor: 'bg-gray-100',
			}
		case 'REGISTERED':
			return {
				title: 'Registered',
				description: 'Car has arrived and been registered',
				color: 'text-blue-600',
				bgColor: 'bg-blue-100',
			}
		case 'ON_DECK':
			return {
				title: 'On Deck',
				description: 'Car is being serviced',
				color: 'text-yellow-600',
				bgColor: 'bg-yellow-100',
			}
		case 'DONE':
			return {
				title: 'Done',
				description: 'Service is complete',
				color: 'text-green-600',
				bgColor: 'bg-green-100',
			}
		default:
			return {
				title: status,
				description: 'Unknown status',
				color: 'text-gray-600',
				bgColor: 'bg-gray-100',
			}
	}
}

export default function StatusDetail({ loaderData }: Route.ComponentProps) {
	const { car, referrerPath } = loaderData
	const statusActions = getStatusActions(car.status)
	const statusInfo = getStatusDisplayInfo(car.status)

	// Determine back button text based on referrer
	const getBackButtonText = (path: string) => {
		switch (path) {
			case '/registration':
				return '← Back to Registration'
			case '/floor':
				return '← Back to Floor'
			case '/handoff':
				return '← Back to Handoff'
			default:
				return '← Back to Home'
		}
	}

	return (
		<main className="min-h-screen p-4">
			<div className="mx-auto max-w-2xl space-y-8">
				<header className="text-center">
					<div className="mb-4 flex justify-start">
						<a
							href={referrerPath}
							className="inline-flex items-center rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
						>
							{getBackButtonText(referrerPath)}
						</a>
					</div>
					<h1 className="mb-2 text-3xl font-bold text-gray-900">
						Car #{car.id} Details
					</h1>
					<p className="text-gray-600">Current Status: {statusInfo.title}</p>
				</header>

				{/* Status Badge */}
				<section className="text-center">
					<div
						className={`inline-flex items-center rounded-full px-4 py-2 ${statusInfo.bgColor}`}
					>
						<span className={`text-sm font-semibold ${statusInfo.color}`}>
							{statusInfo.title}
						</span>
					</div>
					<p className="mt-2 text-sm text-gray-600">{statusInfo.description}</p>
				</section>

				{/* Car Details */}
				<section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
					<h2 className="text-xl font-semibold text-gray-900">
						Vehicle Information
					</h2>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700">
								Make
							</label>
							<p className="mt-1 text-lg text-gray-900">{car.make}</p>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700">
								Model
							</label>
							<p className="mt-1 text-lg text-gray-900">{car.model}</p>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700">
								Color
							</label>
							<p className="mt-1 text-lg text-gray-900">{car.color}</p>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700">
								License Plate
							</label>
							<p className="mt-1 text-lg text-gray-900">{car.license_plate}</p>
						</div>
					</div>
				</section>

				{/* Action Buttons */}
				<section className="space-y-4">
					<form method="post" className="space-y-4">
						<input type="hidden" name="referrerPath" value={referrerPath} />

						{/* Primary Action */}
						{statusActions.primary && (
							<button
								type="submit"
								name="targetStatus"
								value={statusActions.primary.targetStatus}
								className={`w-full rounded-lg p-4 text-lg font-semibold transition-colors ${statusActions.primary.className}`}
							>
								{statusActions.primary.label}
							</button>
						)}

						{/* Secondary Actions */}
						{statusActions.secondary.length > 0 && (
							<div className="space-y-2">
								{statusActions.secondary.map((action) => (
									<button
										key={action.targetStatus}
										type="submit"
										name="targetStatus"
										value={action.targetStatus}
										className={`w-full rounded-lg p-3 text-base font-semibold transition-colors ${action.className}`}
									>
										{action.label}
									</button>
								))}
							</div>
						)}
					</form>
				</section>
			</div>
		</main>
	)
}
