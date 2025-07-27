import { parseWithZod } from '@conform-to/zod'
import { Link, redirect } from 'react-router'
import { CarCard } from '../components/CarCard'
import { SearchForm } from '../components/SearchForm'
import { useRevalidateOnCarUpdates } from '../hooks/useRevalidateOnCarUpdates'
import { carLookupSchema } from '../lib/validation'
import type { Route } from './+types/pickup'

export function meta({}: Route.MetaArgs) {
	return [
		{ title: 'Pickup - Car Tracker' },
		{
			name: 'description',
			content: 'Pickup and handoff volunteer interface for car tracking',
		},
	]
}

export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData()
	const submission = parseWithZod(formData, { schema: carLookupSchema })

	if (submission.status !== 'success') {
		return submission.reply()
	}

	// Redirect to the unified status page
	return redirect(`/pickup/${submission.value.carId}`)
}

export async function loader({ context }: Route.LoaderArgs) {
	const [onDeckCars, doneCars] = await Promise.all([
		context.carDB.getCarsByStatus('ON_DECK'),
		context.carDB.getCarsByStatus('DONE'),
	])

	return {
		onDeckCars,
		doneCars,
	}
}

export default function Pickup({ loaderData }: Route.ComponentProps) {
	const { onDeckCars, doneCars } = loaderData

	// Listen for real-time updates on all status changes
	useRevalidateOnCarUpdates()

	return (
		<main className="min-h-screen p-4">
			<div className="mx-auto max-w-7xl space-y-8">
				<header className="text-center">
					<div className="mb-4 flex justify-start">
						<Link
							to="/"
							className="inline-flex items-center rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
						>
							← Back to Home
						</Link>
					</div>
					<h1 className="mb-2 text-3xl font-bold text-gray-900">Pickup</h1>
					<p className="text-gray-600">
						Manage cars ready for handoff and pickup
					</p>
				</header>

				{/* Search Section */}
				<section className="space-y-4">
					<h2 className="text-xl font-semibold text-gray-900">Look Up Car</h2>
					<SearchForm placeholder="Enter car ID..." />
				</section>

				{/* Two Column Layout */}
				<div className="grid grid-cols-1 gap-8 md:grid-cols-2">
					{/* On Deck Column */}
					<section className="space-y-4">
						<h2 className="text-xl font-semibold text-gray-900">
							On Deck ({onDeckCars.length})
						</h2>
						<p className="text-sm text-gray-600">
							Update car to Ready for Pickup when it is complete and ready to
							hand off to the owner
						</p>

						{onDeckCars.length === 0 ? (
							<p className="py-8 text-center text-gray-500">
								No cars ready for handoff
							</p>
						) : (
							<div className="space-y-3">
								{onDeckCars.map((car) => (
									<CarCard key={car.id} car={car} href={`/pickup/${car.id}`} />
								))}
							</div>
						)}
					</section>

					{/* Ready for Pickup Column */}
					<section className="space-y-4">
						<h2 className="text-xl font-semibold text-gray-900">
							Ready for Pickup ({doneCars.length})
						</h2>
						<p className="text-sm text-gray-600">
							Update car to Picked Up when the owner has collected their vehicle
						</p>

						{doneCars.length === 0 ? (
							<p className="py-8 text-center text-gray-500">
								No cars ready for pickup
							</p>
						) : (
							<div className="space-y-3">
								{doneCars.map((car) => (
									<CarCard key={car.id} car={car} href={`/pickup/${car.id}`} />
								))}
							</div>
						)}
					</section>
				</div>
			</div>
		</main>
	)
}
