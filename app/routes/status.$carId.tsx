import { parseWithZod } from '@conform-to/zod'
import { useMemo } from 'react'
import { Link, redirect, useLocation } from 'react-router'
import { useRevalidateOnCarUpdates } from '../hooks/useRevalidateOnCarUpdates'
import { statusActionSchema } from '../lib/validation'
import type { Route } from './+types/status.$carId'
import { COLOR_CLASSES } from '~/components/CarCard'

export function meta({}: Route.MetaArgs) {
	return [
		{ title: 'Car Status - Car Tracker' },
		{ name: 'description', content: 'Manage car status and transitions' },
	]
}

export async function loader({ context, params }: Route.LoaderArgs) {
	const carId = parseInt(params.carId!, 10)

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
	const carId = parseInt(params.carId!, 10)
	const formData = await request.formData()
	const submission = parseWithZod(formData, { schema: statusActionSchema })

	if (submission.status !== 'success') {
		return submission.reply()
	}

	const { targetStatus } = submission.value

	// Update car status to target status
	await context.carDB.updateCarStatus(carId, targetStatus)

	// Get the current URL to determine the parent route
	const url = new URL(request.url)
	const pathSegments = url.pathname.split('/').filter(Boolean) // Remove empty strings

	// Determine the parent route based on the first path segment
	let redirectPath = '/'
	if (pathSegments.length > 0) {
		redirectPath = `/${pathSegments[0]}`
	}

	// Redirect back to the appropriate parent route
	return redirect(redirectPath)
}

// Helper function to get status-specific actions
function getStatusActions(carStatus: string) {
	switch (carStatus) {
		case 'PRE_ARRIVAL':
			return {
				primary: {
					targetStatus: 'REGISTERED',
					label: 'Move to Registered',
				},
				secondary: [
					{
						targetStatus: 'ON_DECK',
						label: 'Skip to On Deck',
					},
					{
						targetStatus: 'DONE',
						label: 'Skip to Ready for Pickup',
					},
					{
						targetStatus: 'PICKED_UP',
						label: 'Skip to Picked Up',
					},
				],
			}
		case 'REGISTERED':
			return {
				primary: {
					targetStatus: 'ON_DECK',
					label: 'Move to On Deck',
				},
				secondary: [
					{
						targetStatus: 'PRE_ARRIVAL',
						label: 'Return to Pre-Arrival',
					},
					{
						targetStatus: 'DONE',
						label: 'Skip to Ready for Pickup',
					},
					{
						targetStatus: 'PICKED_UP',
						label: 'Skip to Picked Up',
					},
				],
			}
		case 'ON_DECK':
			return {
				primary: {
					targetStatus: 'DONE',
					label: 'Move to Ready for Pickup',
				},
				secondary: [
					{
						targetStatus: 'PRE_ARRIVAL',
						label: 'Return to Pre-Arrival',
					},
					{
						targetStatus: 'REGISTERED',
						label: 'Return to Registered',
					},
					{
						targetStatus: 'PICKED_UP',
						label: 'Skip to Picked Up',
					},
				],
			}
		case 'DONE':
			return {
				primary: {
					targetStatus: 'PICKED_UP',
					label: 'Mark as Picked Up',
				},
				secondary: [
					{
						targetStatus: 'PRE_ARRIVAL',
						label: 'Return to Pre-Arrival',
					},
					{
						targetStatus: 'REGISTERED',
						label: 'Return to Registered',
					},
					{
						targetStatus: 'ON_DECK',
						label: 'Return to On Deck',
					},
				],
			}
		case 'PICKED_UP':
			return {
				primary: null, // No primary action for PICKED_UP status
				secondary: [
					{
						targetStatus: 'PRE_ARRIVAL',
						label: 'Return to Pre-Arrival',
					},
					{
						targetStatus: 'REGISTERED',
						label: 'Return to Registered',
					},
					{
						targetStatus: 'ON_DECK',
						label: 'Return to On Deck',
					},
					{
						targetStatus: 'DONE',
						label: 'Return to Ready for Pickup',
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
				title: 'Ready for Pickup',
				description: 'Service is complete',
				color: 'text-green-600',
				bgColor: 'bg-green-100',
			}
		case 'PICKED_UP':
			return {
				title: 'Picked Up',
				description: 'Vehicle has been collected by owner',
				color: 'text-purple-600',
				bgColor: 'bg-purple-100',
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
	const { car } = loaderData
	const statusActions = getStatusActions(car.status)
	const statusInfo = getStatusDisplayInfo(car.status)

	const location = useLocation()

	// Listen for real-time updates on this specific car's status changes
	useRevalidateOnCarUpdates({
		carIdFilter: car.id,
	})

	// Determine back button text based on referrer
	const { backButtonText, backButtonHref } = useMemo(() => {
		if (location.pathname.startsWith('/registration')) {
			return {
				backButtonText: '← Back to Registration',
				backButtonHref: '/registration',
			}
		} else if (location.pathname.startsWith('/floor')) {
			return {
				backButtonText: '← Back to Floor',
				backButtonHref: '/floor',
			}
		} else if (location.pathname.startsWith('/handoff')) {
			return {
				backButtonText: '← Back to Handoff',
				backButtonHref: '/handoff',
			}
		} else if (location.pathname.startsWith('/pickup')) {
			return {
				backButtonText: '← Back to Pickup',
				backButtonHref: '/pickup',
			}
		} else {
			return {
				backButtonText: '← Back to Home',
				backButtonHref: '/',
			}
		}
	}, [location.pathname])

	return (
		<main className="min-h-screen p-4">
			<div className="mx-auto max-w-2xl space-y-8">
				<header className="text-center">
					<div className="mb-4 flex justify-start">
						<Link
							to={backButtonHref}
							className="inline-flex items-center rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
						>
							{backButtonText}
						</Link>
					</div>
					<h1 className="mb-2 text-3xl font-bold text-gray-900">
						Car #{car.id} Details
					</h1>
				</header>

				{/* Car Details */}
				<section
					className={`space-y-4 rounded-lg border border-gray-200 p-6 ${COLOR_CLASSES[car.color].bg}`}
				>
					<div className="flex items-center justify-between">
						<h2
							className={`text-xl font-semibold ${COLOR_CLASSES[car.color].text}`}
						>
							Vehicle
						</h2>
						<div
							className={`inline-flex items-center rounded-full px-4 py-2 ${statusInfo.bgColor}`}
						>
							<span className={`text-sm font-semibold ${statusInfo.color}`}>
								{statusInfo.title}
							</span>
						</div>
					</div>

					<div className="rounded-lg bg-white p-4">
						<div className="flex items-center justify-between">
							<p className="text-lg text-gray-900">
								{car.make} {car.model}
							</p>
							<p className="text-lg text-gray-900">{car.license_plate}</p>
						</div>
					</div>
				</section>

				{/* Action Buttons */}
				<section className="space-y-4">
					<form method="post" className="space-y-4">
						{/* Primary Action */}
						{statusActions.primary && (
							<button
								type="submit"
								name="targetStatus"
								value={statusActions.primary.targetStatus}
								className="w-full cursor-pointer rounded-lg bg-blue-600 p-4 text-lg font-semibold text-white transition-colors hover:bg-blue-700"
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
										className="w-full cursor-pointer rounded-lg bg-gray-100 p-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
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
