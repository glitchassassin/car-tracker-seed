import { parseWithZod } from '@conform-to/zod'
import { redirect } from 'react-router'
import { CarCard } from '../../components/CarCard'
import { SearchForm } from '../../components/SearchForm'
import { createCarDB } from '../../lib/car-db'
import { carLookupSchema } from '../../lib/validation'
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

export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData()
	const submission = parseWithZod(formData, { schema: carLookupSchema })

	if (submission.status !== 'success') {
		return submission.reply()
	}

	// Redirect to the unified status page
	return redirect(`/handoff/${submission.value.carId}`)
}

export async function loader({ context }: Route.LoaderArgs) {
	const carDB = createCarDB(context.cloudflare.env)
	const onDeckCars = await carDB.getCarsByStatus('ON_DECK')

	return {
		onDeckCars,
	}
}

export default function Handoff({ loaderData }: Route.ComponentProps) {
	const { onDeckCars } = loaderData

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
					<h1 className="mb-2 text-3xl font-bold text-gray-900">Handoff</h1>
					<p className="text-gray-600">Complete service and hand off cars</p>
				</header>

				{/* Search Section */}
				<section className="space-y-4">
					<h2 className="text-xl font-semibold text-gray-900">Look Up Car</h2>
					<SearchForm placeholder="Enter car ID..." />
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
			</div>
		</main>
	)
}
