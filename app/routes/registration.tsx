import { parseWithZod } from '@conform-to/zod'
import { Link, redirect } from 'react-router'
import { CarCard } from '../components/CarCard'
import { SearchForm } from '../components/SearchForm'
import { useRevalidateOnCarUpdates } from '../hooks/useRevalidateOnCarUpdates'
import { carLookupSchema } from '../lib/validation'
import type { Route } from './+types/registration'

export function meta({}: Route.MetaArgs) {
	return [
		{ title: 'Registration - Car Tracker' },
		{
			name: 'description',
			content: 'Registration and floor volunteer interface for car tracking',
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
	return redirect(`/registration/${submission.value.carId}`)
}

export async function loader({ context }: Route.LoaderArgs) {
	const [preArrivalCars, registeredCars] = await Promise.all([
		context.carDB.getCarsByStatus('PRE_ARRIVAL'),
		context.carDB.getCarsByStatus('REGISTERED'),
	])

	return {
		preArrivalCars,
		registeredCars,
	}
}

export default function Registration({ loaderData }: Route.ComponentProps) {
	const { preArrivalCars, registeredCars } = loaderData

	// Listen for real-time updates on PRE_ARRIVAL and REGISTERED status changes
	useRevalidateOnCarUpdates({
		statusFilter: ['PRE_ARRIVAL', 'REGISTERED'],
	})

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
					<h1 className="mb-2 text-3xl font-bold text-gray-900">
						Registration
					</h1>
					<p className="text-gray-600">
						Manage cars for registration and floor entry
					</p>
				</header>

				{/* Search Section */}
				<section className="space-y-4">
					<h2 className="text-xl font-semibold text-gray-900">Look Up Car</h2>
					<SearchForm placeholder="Enter car ID..." />
				</section>

				{/* Two Column Layout */}
				<div className="grid grid-cols-1 gap-8 md:grid-cols-2">
					{/* Pre-Arrival Column */}
					<section className="space-y-4">
						<h2 className="text-xl font-semibold text-gray-900">
							Pre-Arrival ({preArrivalCars.length})
						</h2>
						<p className="text-sm text-gray-600">
							Update car to Registered when it has arrived and completed
							registration
						</p>

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

					{/* Registered Column */}
					<section className="space-y-4">
						<h2 className="text-xl font-semibold text-gray-900">
							Registered ({registeredCars.length})
						</h2>
						<p className="text-sm text-gray-600">
							Update car to On Deck when it is entering the floor for service
						</p>

						{registeredCars.length === 0 ? (
							<p className="py-8 text-center text-gray-500">
								No cars waiting for service
							</p>
						) : (
							<div className="space-y-3">
								{registeredCars.map((car) => (
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
			</div>
		</main>
	)
}
