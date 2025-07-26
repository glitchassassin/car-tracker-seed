import { CarCard } from '../../components/CarCard'
import { SearchForm } from '../../components/SearchForm'
import { createCarDB } from '../../lib/car-db'
import type { Route } from './+types/route'

export function meta({}: Route.MetaArgs) {
	return [
		{ title: 'Registration - Car Tracker' },
		{
			name: 'description',
			content: 'Registration volunteer interface for car tracking',
		},
	]
}

export async function loader({ context, request }: Route.LoaderArgs) {
	const carDB = createCarDB(context.cloudflare.env)
	const url = new URL(request.url)
	const searchId = url.searchParams.get('search')

	let searchResult = null
	if (searchId) {
		const carId = parseInt(searchId, 10)
		if (!isNaN(carId)) {
			searchResult = await carDB.getCarById(carId)
		}
	}

	const preArrivalCars = await carDB.getCarsByStatus('PRE_ARRIVAL')

	return {
		searchResult,
		preArrivalCars,
		searchId,
	}
}

export default function Registration({ loaderData }: Route.ComponentProps) {
	const { searchResult, preArrivalCars, searchId } = loaderData

	return (
		<main className="min-h-screen p-4">
			<div className="mx-auto max-w-4xl space-y-8">
				<header className="text-center">
					<h1 className="mb-2 text-3xl font-bold text-gray-900">
						Registration
					</h1>
					<p className="text-gray-600">Register cars as they arrive</p>
				</header>

				{/* Search Section */}
				<section className="space-y-4">
					<h2 className="text-xl font-semibold text-gray-900">Look Up Car</h2>
					<SearchForm placeholder="Enter car ID..." />

					{searchResult && (
						<div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
							<h3 className="mb-2 font-semibold text-blue-900">
								Found Car #{searchResult.id}
							</h3>
							<p className="text-blue-800">
								{searchResult.make} {searchResult.model} • {searchResult.color}{' '}
								• {searchResult.license_plate}
							</p>
							<a
								href={`/registration/${searchResult.id}`}
								className="mt-2 inline-block rounded bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
							>
								View Details
							</a>
						</div>
					)}

					{searchId && !searchResult && (
						<div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
							<p className="text-red-800">No car found with ID {searchId}</p>
						</div>
					)}
				</section>

				{/* Queue Section */}
				<section className="space-y-4">
					<h2 className="text-xl font-semibold text-gray-900">
						Pre-Arrival Cars ({preArrivalCars.length})
					</h2>

					{preArrivalCars.length === 0 ? (
						<p className="py-8 text-center text-gray-500">
							No cars waiting for registration
						</p>
					) : (
						<div className="space-y-3">
							{preArrivalCars.map((car) => (
								<CarCard
									key={car.id}
									car={car}
									href={`/registration/${car.id}`}
								/>
							))}
						</div>
					)}
				</section>

				{/* Back to Home */}
				<div className="text-center">
					<a
						href="/"
						className="inline-block rounded-lg bg-gray-100 px-6 py-3 text-lg font-semibold text-gray-700 transition-colors hover:bg-gray-200"
					>
						Back to Home
					</a>
				</div>
			</div>
		</main>
	)
}
