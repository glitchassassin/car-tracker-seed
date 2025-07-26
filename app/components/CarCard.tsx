import type { Car, CarColor } from '../lib/car-db'

interface CarCardProps {
	car: Car
	href: string
}

// Type-safe color mapping with Tailwind classes
const COLOR_CLASSES: Record<CarColor, { bg: string; text: string }> = {
	red: { bg: 'bg-red-600', text: 'text-white' },
	blue: { bg: 'bg-blue-600', text: 'text-white' },
	green: { bg: 'bg-green-600', text: 'text-white' },
	yellow: { bg: 'bg-yellow-400', text: 'text-black' },
	orange: { bg: 'bg-orange-600', text: 'text-white' },
	purple: { bg: 'bg-purple-600', text: 'text-white' },
	brown: { bg: 'bg-amber-700', text: 'text-white' },
	black: { bg: 'bg-gray-900', text: 'text-white' },
	white: { bg: 'bg-gray-100', text: 'text-gray-900' },
	gray: { bg: 'bg-gray-600', text: 'text-white' },
	silver: { bg: 'bg-gray-300', text: 'text-gray-900' },
	gold: { bg: 'bg-yellow-500', text: 'text-black' },
}

export function CarCard({ car, href }: CarCardProps) {
	const { bg, text } = COLOR_CLASSES[car.color]

	return (
		<a
			href={href}
			data-testid={`car-${car.id}`}
			className={`block rounded-lg border border-gray-200 transition-colors hover:opacity-90 ${bg}`}
		>
			<div className="flex items-center p-4">
				{/* ID Number - Large font on the left */}
				<div className={`w-20 flex-shrink-0 text-3xl font-bold ${text}`}>
					#{car.id}
				</div>

				{/* Make & Model */}
				<div className={`flex-1 px-4 text-lg font-semibold ${text}`}>
					{car.make} {car.model}
				</div>

				{/* License Plate */}
				<div
					className={`flex-shrink-0 font-mono text-lg font-semibold ${text}`}
				>
					{car.license_plate}
				</div>
			</div>
		</a>
	)
}
