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
					<a
						href="/registration"
						className="block flex min-h-[60px] w-full items-center justify-center rounded-lg bg-blue-600 p-6 text-center text-lg font-semibold text-white transition-colors hover:bg-blue-700"
					>
						Registration
					</a>

					<a
						href="/floor"
						className="block flex min-h-[60px] w-full items-center justify-center rounded-lg bg-green-700 p-6 text-center text-lg font-semibold text-white transition-colors hover:bg-green-800"
					>
						Floor
					</a>

					<a
						href="/handoff"
						className="block flex min-h-[60px] w-full items-center justify-center rounded-lg bg-orange-700 p-6 text-center text-lg font-semibold text-white transition-colors hover:bg-orange-800"
					>
						Handoff
					</a>
				</nav>
			</div>
		</main>
	)
}
