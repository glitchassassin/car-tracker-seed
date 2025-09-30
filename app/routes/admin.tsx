import { parseWithZod } from '@conform-to/zod'
import { Link, redirect } from 'react-router'
import type { Route } from './+types/admin'
import { CarCard } from '~/components/CarCard'
import { SearchForm } from '~/components/SearchForm'
import { useRevalidateOnCarUpdates } from '~/hooks/useRevalidateOnCarUpdates'
import type { CarStatus, Car } from '~/lib/car-db'
import { carLookupSchema } from '~/lib/validation'

export function meta({}: Route.MetaArgs) {
	return [
		{ title: 'Admin Dashboard - Car Tracker' },
		{
			name: 'description',
			content: 'Admin view of all cars organized by status',
		},
	]
}

export async function loader({ context, request }: Route.LoaderArgs) {
	// Get all cars and organize them by status
	const allCars = await context.carDB.getAllCars()

	const carsByStatus: Record<CarStatus, Car[]> = {
		PRE_ARRIVAL: [],
		REGISTERED: [],
		ON_DECK: [],
		DONE: [],
		PICKED_UP: [],
	}

	// Group cars by status (already sorted by ID from database)
	allCars.forEach((car: Car) => {
		carsByStatus[car.status].push(car)
	})

	// Check for import success message
	const url = new URL(request.url)
	const imported = url.searchParams.get('imported')
	const mode = url.searchParams.get('mode')

	let importSuccess = null
	if (imported && mode) {
		importSuccess = {
			count: parseInt(imported, 10),
			mode,
		}
	}

	return { carsByStatus, importSuccess }
}

export async function action({ request, context }: Route.ActionArgs) {
	const formData = await request.formData()
	const submission = parseWithZod(formData, { schema: carLookupSchema })

	if (submission.status !== 'success') {
		return submission.reply()
	}

	const { searchTerm } = submission.value

	// Search for the car by ID or license plate
	const car = await context.carDB.searchCarByIdOrLicensePlate(searchTerm)

	if (!car) {
		// Return an error if no car is found
		return submission.reply({
			formErrors: ['No car found with that ID or license plate'],
		})
	}

	// Redirect to the admin detail page for the found car
	throw redirect(`/admin/${car.id}`)
}

// Helper function to get status display info
function getStatusDisplayInfo(status: CarStatus) {
	switch (status) {
		case 'PRE_ARRIVAL':
			return {
				title: 'Pre-Arrival',
				description: 'Waiting to arrive',
				color: 'text-gray-600',
				bgColor: 'bg-gray-100',
				borderColor: 'border-gray-300',
			}
		case 'REGISTERED':
			return {
				title: 'Registered',
				description: 'Arrived and registered',
				color: 'text-blue-600',
				bgColor: 'bg-blue-100',
				borderColor: 'border-blue-300',
			}
		case 'ON_DECK':
			return {
				title: 'On Deck',
				description: 'Being serviced',
				color: 'text-yellow-600',
				bgColor: 'bg-yellow-100',
				borderColor: 'border-yellow-300',
			}
		case 'DONE':
			return {
				title: 'Ready for Pickup',
				description: 'Service complete',
				color: 'text-green-600',
				bgColor: 'bg-green-100',
				borderColor: 'border-green-300',
			}
		case 'PICKED_UP':
			return {
				title: 'Picked Up',
				description: 'Collected by owner',
				color: 'text-purple-600',
				bgColor: 'bg-purple-100',
				borderColor: 'border-purple-300',
			}
	}
}

export default function Admin({
	loaderData: { carsByStatus, importSuccess },
	actionData,
}: Route.ComponentProps) {
	// Listen for real-time updates on all status changes
	useRevalidateOnCarUpdates()

	return (
		<main className="min-h-screen p-4">
			<div className="mx-auto max-w-7xl space-y-6">
				{/* Import Success Message */}
				{importSuccess && (
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
									Import Successful!
								</h3>
								<div className="mt-2 text-sm text-green-700">
									<p>
										Successfully imported {importSuccess.count} cars using{' '}
										<strong>{importSuccess.mode}</strong> mode.
									</p>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Header */}
				<header className="text-center">
					<div className="mb-4 flex justify-between">
						<Link
							to="/"
							className="inline-flex items-center rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
						>
							← Back to Home
						</Link>
						<div className="flex space-x-3">
							<Link
								to="/admin/analytics"
								className="inline-flex items-center rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-700"
							>
								📊 Analytics
							</Link>
							<Link
								to="/admin/upload"
								className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700"
							>
								📄 Import CSV
							</Link>
							<Link
								to="/admin/new"
								className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
							>
								+ New Car
							</Link>
						</div>
					</div>
					<h1 className="mb-2 text-3xl font-bold text-gray-900">
						Admin Dashboard
					</h1>
					<p className="text-gray-600">
						All vehicles organized by current status
					</p>
				</header>

				{/* Search Section */}
				<section className="space-y-4">
					<h2 className="text-xl font-semibold text-gray-900">Look Up Car</h2>
					<SearchForm
						placeholder="Enter car ID or license plate..."
						lastResult={actionData}
					/>
				</section>

				{/* Summary Stats */}
				<div className="mt-8 rounded-lg bg-gray-50 p-6">
					<h3 className="mb-4 text-lg font-semibold text-gray-900">Summary</h3>
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
						{Object.entries(carsByStatus).map(([status, cars]) => {
							const statusInfo = getStatusDisplayInfo(status as CarStatus)
							const carsArray = cars as Car[]
							return (
								<div key={status} className="text-center">
									<div className={`text-2xl font-bold ${statusInfo.color}`}>
										{carsArray.length}
									</div>
									<div className="text-sm text-gray-600">
										{statusInfo.title}
									</div>
								</div>
							)
						})}
					</div>
				</div>

				{/* Status Columns */}
				<div className="flex gap-6 overflow-x-auto pb-4">
					{Object.entries(carsByStatus).map(([status, cars]) => {
						const statusInfo = getStatusDisplayInfo(status as CarStatus)
						const carsArray = cars as Car[]

						return (
							<div
								key={status}
								className={`w-[320px] flex-shrink-0 rounded-lg border-2 ${statusInfo.borderColor} ${statusInfo.bgColor}`}
							>
								{/* Column Header */}
								<div className="rounded-t-lg border-b border-gray-200 bg-white p-4">
									<h2 className={`text-lg font-semibold ${statusInfo.color}`}>
										{statusInfo.title}
									</h2>
									<p className="text-sm text-gray-600">
										{statusInfo.description}
									</p>
									<div className="mt-2 text-2xl font-bold text-gray-900">
										{carsArray.length}
									</div>
								</div>

								{/* Cars List */}
								<div className="space-y-3 p-4">
									{carsArray.length === 0 ? (
										<div className="py-8 text-center text-gray-500">
											No cars in this status
										</div>
									) : (
										carsArray.map((car: Car) => (
											<CarCard
												key={car.id}
												car={car}
												href={`/admin/${car.id}`}
											/>
										))
									)}
								</div>
							</div>
						)
					})}
				</div>
			</div>
		</main>
	)
}
