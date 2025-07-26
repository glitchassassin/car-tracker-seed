import { parseWithZod } from '@conform-to/zod'
import { redirect } from 'react-router'
import { CarCard } from '../../components/CarCard'
import { SearchForm } from '../../components/SearchForm'
import { useRevalidateOnCarUpdates } from '../../hooks/useRevalidateOnCarUpdates'
import { createCarDB } from '../../lib/car-db'
import { carLookupSchema } from '../../lib/validation'
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

export async function loader({ context }: Route.LoaderArgs) {
	const carDB = createCarDB(context.cloudflare.env)
	const preArrivalCars = await carDB.getCarsByStatus('PRE_ARRIVAL')

	return {
		preArrivalCars,
	}
}

export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData()
	const submission = parseWithZod(formData, { schema: carLookupSchema })

	if (submission.status !== 'success') {
		return submission.reply()
	}

	// Redirect to the unified status page
	return redirect(`/registration/${submission.value.carId}`)
}

export default function Registration({ loaderData }: Route.ComponentProps) {
	const { preArrivalCars } = loaderData

	// Listen for real-time updates on PRE_ARRIVAL status changes
	useRevalidateOnCarUpdates({
		statusFilter: 'PRE_ARRIVAL',
	})

	return (
		<main className="min-h-screen p-4">
			<div className="mx-auto max-w-4xl space-y-8">
				<header className="text-center">
					<div className="mb-4 flex justify-start">
						<a
							href="/"
							className="inline-flex items-center rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
						>
							← Back to Home
						</a>
					</div>
					<h1 className="mb-2 text-3xl font-bold text-gray-900">
						Registration
					</h1>
					<p className="text-gray-600">
						Update car to Registered when it has arrived and completed
						registration
					</p>
				</header>

				{/* Search Section */}
				<section className="space-y-4">
					<h2 className="text-xl font-semibold text-gray-900">Look Up Car</h2>
					<SearchForm placeholder="Enter car ID..." />
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
			</div>
		</main>
	)
}
