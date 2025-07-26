import { CarCard } from '../../components/CarCard'
import { SearchForm } from '../../components/SearchForm'
import { createCarDB } from '../../lib/car-db'
import type { Route } from './+types/route'

export function meta({}: Route.MetaArgs) {
	return [
		{ title: 'Floor - Car Tracker' },
		{
			name: 'description',
			content: 'Floor volunteer interface for car tracking',
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

	const registeredCars = await carDB.getCarsByStatus('REGISTERED')

	return {
		searchResult,
		registeredCars,
		searchId,
	}
}

export default function Floor({ loaderData }: Route.ComponentProps) {
	const { searchResult, registeredCars, searchId } = loaderData

	return (
		<main className="min-h-screen p-4">
			<div className="mx-auto max-w-4xl space-y-8">
				<header className="text-center">
					<h1 className="mb-2 text-3xl font-bold text-gray-900">Floor</h1>
					<p className="text-gray-600">Start service on registered cars</p>
				</header>

				{/* Search Section */}
				<section className="space-y-4">
					<h2 className="text-xl font-semibold text-gray-900">Look Up Car</h2>
					<SearchForm placeholder="Enter car ID..." />

					{searchResult && (
						<div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
							<h3 className="mb-2 font-semibold text-green-900">
								Found Car #{searchResult.id}
							</h3>
							<p className="text-green-800">
								{searchResult.make} {searchResult.model} • {searchResult.color}{' '}
								• {searchResult.license_plate}
							</p>
							<a
								href={`/floor/${searchResult.id}`}
								className="mt-2 inline-block rounded bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
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
						Registered Cars ({registeredCars.length})
					</h2>

					{registeredCars.length === 0 ? (
						<p className="py-8 text-center text-gray-500">
							No cars waiting for service
						</p>
					) : (
						<div className="space-y-3">
							{registeredCars.map((car) => (
								<CarCard key={car.id} car={car} href={`/floor/${car.id}`} />
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
