import { redirect } from 'react-router'
import { createCarDB } from '../../lib/car-db'
import type { Route } from './+types/route'

export function meta({}: Route.MetaArgs) {
	return [
		{ title: 'Car Details - Handoff' },
		{ name: 'description', content: 'Verify and complete service on car' },
	]
}

export async function loader({ context, params }: Route.LoaderArgs) {
	const carDB = createCarDB(context.cloudflare.env)
	const carId = parseInt(params.carId!, 10)

	if (isNaN(carId)) {
		throw new Error('Invalid car ID')
	}

	const car = await carDB.getCarById(carId)
	if (!car) {
		throw new Error('Car not found')
	}

	return { car }
}

export async function action({ context, params, request }: Route.ActionArgs) {
	const carDB = createCarDB(context.cloudflare.env)
	const carId = parseInt(params.carId!, 10)
	const formData = await request.formData()
	const action = formData.get('action')

	if (action === 'ready-pickup') {
		await carDB.updateCarStatus(carId, 'DONE')
		return redirect('/handoff')
	}

	return null
}

export default function HandoffDetail({ loaderData }: Route.ComponentProps) {
	const { car } = loaderData

	return (
		<main className="min-h-screen p-4">
			<div className="mx-auto max-w-2xl space-y-8">
				<header className="text-center">
					<div className="mb-4 flex justify-start">
						<a
							href="/handoff"
							className="inline-flex items-center rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
						>
							← Back to Handoff
						</a>
					</div>
					<h1 className="mb-2 text-3xl font-bold text-gray-900">
						Car #{car.id} Details
					</h1>
					<p className="text-gray-600">
						Verify car information before completing service
					</p>
				</header>

				{/* Car Details */}
				<section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
					<h2 className="text-xl font-semibold text-gray-900">
						Vehicle Information
					</h2>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700">
								Make
							</label>
							<p className="mt-1 text-lg text-gray-900">{car.make}</p>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700">
								Model
							</label>
							<p className="mt-1 text-lg text-gray-900">{car.model}</p>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700">
								Color
							</label>
							<p className="mt-1 text-lg text-gray-900">{car.color}</p>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700">
								License Plate
							</label>
							<p className="mt-1 text-lg text-gray-900">{car.license_plate}</p>
						</div>
					</div>
				</section>

				{/* Action Buttons */}
				<section className="space-y-4">
					<form method="post" className="space-y-4">
						<button
							type="submit"
							name="action"
							value="ready-pickup"
							className="w-full rounded-lg bg-orange-700 p-4 text-lg font-semibold text-white transition-colors hover:bg-orange-800"
						>
							Ready for Pickup
						</button>
					</form>
				</section>
			</div>
		</main>
	)
}
