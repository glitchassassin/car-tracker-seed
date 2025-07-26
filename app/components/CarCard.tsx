import type { Car } from '../lib/car-db'

interface CarCardProps {
	car: Car
	href: string
}

export function CarCard({ car, href }: CarCardProps) {
	return (
		<a
			href={href}
			data-testid={`car-${car.id}`}
			className="block rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
		>
			<div className="flex items-start justify-between">
				<div className="flex-1">
					<h3 className="text-lg font-semibold text-gray-900">Car #{car.id}</h3>
					<p className="text-gray-600">
						{car.make} {car.model}
					</p>
					<p className="text-gray-600">
						{car.color} • {car.license_plate}
					</p>
				</div>
				<div className="text-right">
					<span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
						{car.status.replace('_', ' ')}
					</span>
				</div>
			</div>
		</a>
	)
}
