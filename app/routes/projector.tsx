import { useRevalidateOnCarUpdates } from '../hooks/useRevalidateOnCarUpdates'
import type { Car } from '../lib/car-db'
import type { Route } from './+types/projector'

export function meta({}: Route.MetaArgs) {
	return [
		{ title: 'Projector - Car Tracker' },
		{
			name: 'description',
			content: 'Projector view showing current car status',
		},
	]
}

export async function loader({ context }: Route.LoaderArgs) {
	const projectorData = await context.carDB.getProjectorCars()

	return projectorData
}

export default function Projector({ loaderData }: Route.ComponentProps) {
	const { inProgressCars, doneCars } = loaderData

	// Listen for real-time updates on status changes relevant to projector view
	useRevalidateOnCarUpdates({
		statusFilter: ['REGISTERED', 'ON_DECK', 'DONE'],
	})

	return (
		<main className="min-h-screen bg-gray-900 p-8">
			<div className="mx-auto max-w-6xl">
				<header className="mb-8 text-center">
					<h1 className="mb-2 text-5xl font-bold text-white">Car Status</h1>
				</header>

				<div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
					{/* In Progress Section */}
					<section className="space-y-4">
						<h2 className="text-3xl font-bold text-yellow-400">
							In Progress ({inProgressCars.length})
						</h2>

						{inProgressCars.length === 0 ? (
							<p className="py-8 text-center text-2xl text-gray-400">
								No cars in progress
							</p>
						) : (
							<div className="flex flex-wrap gap-4">
								{inProgressCars.map((car: Car) => (
									<div
										key={car.id}
										className="flex h-20 w-20 items-center justify-center rounded-lg bg-yellow-500 text-3xl font-bold text-black shadow-lg"
									>
										{car.id}
									</div>
								))}
							</div>
						)}
					</section>

					{/* Ready for Pickup Section */}
					<section className="space-y-4">
						<h2 className="text-3xl font-bold text-green-400">
							Ready for Pickup ({doneCars.length})
						</h2>

						{doneCars.length === 0 ? (
							<p className="py-8 text-center text-2xl text-gray-400">
								No cars completed
							</p>
						) : (
							<div className="flex flex-wrap gap-6">
								{doneCars.map((car: Car) => (
									<div
										key={car.id}
										className="flex h-20 w-20 items-center justify-center rounded-lg bg-green-500 text-3xl font-bold text-black shadow-lg"
									>
										{car.id}
									</div>
								))}
							</div>
						)}
					</section>
				</div>
			</div>
		</main>
	)
}
