import { Link } from 'react-router'
import type { Route } from './+types/route'

export function meta({}: Route.MetaArgs) {
	return [
		{ title: 'Car Tracker - Volunteer Portal' },
		{
			name: 'description',
			content: 'Select your volunteer role for the car tracking system',
		},
	]
}

export default function Home() {
	return (
		<main className="flex min-h-screen items-center justify-center p-4">
			<div className="w-full max-w-md space-y-8">
				<header className="text-center">
					<h1 className="mb-2 text-3xl font-bold text-gray-900">Car Tracker</h1>
					<p className="text-gray-600">Select your volunteer role</p>
				</header>

				<nav className="space-y-4">
					<Link
						to="/registration"
						className="flex min-h-[60px] w-full flex-col items-center justify-center rounded-lg bg-blue-600 p-6 text-center text-lg font-semibold text-white transition-colors hover:bg-blue-700"
					>
						<div>Registration</div>
						<div className="text-sm">At registration table</div>
					</Link>

					<Link
						to="/floor"
						className="flex min-h-[60px] w-full flex-col items-center justify-center rounded-lg bg-green-700 p-6 text-center text-lg font-semibold text-white transition-colors hover:bg-green-800"
					>
						<div>Floor</div>
						<div className="text-sm">At the floor entrance</div>
					</Link>

					<Link
						to="/handoff"
						className="flex min-h-[60px] w-full flex-col items-center justify-center rounded-lg bg-orange-700 p-6 text-center text-lg font-semibold text-white transition-colors hover:bg-orange-800"
					>
						<div>Handoff</div>
						<div className="text-sm">At the floor exit</div>
					</Link>

					<Link
						to="/pickup"
						className="flex min-h-[60px] w-full flex-col items-center justify-center rounded-lg bg-red-700 p-6 text-center text-lg font-semibold text-white transition-colors hover:bg-red-800"
					>
						<div>Pickup</div>
						<div className="text-sm">At the handoff table</div>
					</Link>

					<Link
						to="/projector"
						className="flex min-h-[60px] w-full flex-col items-center justify-center rounded-lg bg-purple-700 p-6 text-center text-lg font-semibold text-white transition-colors hover:bg-purple-800"
					>
						<div>Projector</div>
						<div className="text-sm">Display current status</div>
					</Link>
				</nav>
			</div>
		</main>
	)
}
