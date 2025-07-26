import { CarCard } from '../../components/CarCard'
import { SearchForm } from '../../components/SearchForm'
import { createCarDB } from '../../lib/car-db'
import type { Route } from './+types/route'

export function meta({}: Route.MetaArgs) {
	return [
		{ title: 'Handoff - Car Tracker' },
		{
			name: 'description',
			content: 'Handoff volunteer interface for car tracking',
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

	const onDeckCars = await carDB.getCarsByStatus('ON_DECK')

	return {
		searchResult,
		onDeckCars,
		searchId,
	}
}

export default function Handoff({ loaderData }: Route.ComponentProps) {
	const { searchResult, onDeckCars, searchId } = loaderData

	return (
		<main className="min-h-screen p-4">
			<div className="mx-auto max-w-4xl space-y-8">
				<header className="text-center">
					<h1 className="mb-2 text-3xl font-bold text-gray-900">Handoff</h1>
					<p className="text-gray-600">Complete service and hand off cars</p>
				</header>

				{/* Search Section */}
				<section className="space-y-4">
					<h2 className="text-xl font-semibold text-gray-900">Look Up Car</h2>
					<SearchForm placeholder="Enter car ID..." />

					{searchResult && (
						<div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 p-4">
							<h3 className="mb-2 font-semibold text-orange-900">
								Found Car #{searchResult.id}
							</h3>
							<p className="text-orange-800">
								{searchResult.make} {searchResult.model} • {searchResult.color}{' '}
								• {searchResult.license_plate}
							</p>
							<a
								href={`/handoff/${searchResult.id}`}
								className="mt-2 inline-block rounded bg-orange-600 px-4 py-2 text-white transition-colors hover:bg-orange-700"
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
						On Deck Cars ({onDeckCars.length})
					</h2>

					{onDeckCars.length === 0 ? (
						<p className="py-8 text-center text-gray-500">
							No cars ready for handoff
						</p>
					) : (
						<div className="space-y-3">
							{onDeckCars.map((car) => (
								<CarCard key={car.id} car={car} href={`/handoff/${car.id}`} />
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
