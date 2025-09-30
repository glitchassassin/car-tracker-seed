import { Link } from 'react-router'
import type { Route } from './+types/admin.analytics'

export function meta({}: Route.MetaArgs) {
	return [
		{ title: 'Analytics - Car Tracker' },
		{
			name: 'description',
			content: 'Analytics dashboard showing vehicle status duration statistics',
		},
	]
}

export async function loader({ context }: Route.LoaderArgs) {
	const analytics = await context.carDB.getStatusDurationAnalytics()
	return { analytics }
}

// Helper function to format duration in minutes to a readable format
function formatDuration(minutes: number): string {
	if (minutes === 0) return '0 min'

	const hours = Math.floor(minutes / 60)
	const mins = Math.round(minutes % 60)

	if (hours === 0) {
		return `${mins} min`
	} else if (mins === 0) {
		return `${hours}h`
	} else {
		return `${hours}h ${mins}m`
	}
}

// Helper function to get status display info
function getStatusDisplayInfo(status: 'REGISTERED' | 'ON_DECK' | 'DONE') {
	switch (status) {
		case 'REGISTERED':
			return {
				title: 'Staging',
				description: 'Time in staging, if a bay was not immediately available',
				color: 'text-blue-600',
				bgColor: 'bg-blue-50',
				borderColor: 'border-blue-200',
				chartColor: '#3B82F6',
			}
		case 'ON_DECK':
			return {
				title: 'On Deck',
				description: 'Time between registration and handoff',
				color: 'text-yellow-600',
				bgColor: 'bg-yellow-50',
				borderColor: 'border-yellow-200',
				chartColor: '#EAB308',
			}
		case 'DONE':
			return {
				title: 'Ready for Pickup',
				description: 'Time waiting to be collected',
				color: 'text-green-600',
				bgColor: 'bg-green-50',
				borderColor: 'border-green-200',
				chartColor: '#10B981',
			}
	}
}

export default function AdminAnalytics({
	loaderData: { analytics },
}: Route.ComponentProps) {
	const statuses = ['REGISTERED', 'ON_DECK', 'DONE'] as const

	return (
		<main className="min-h-screen p-4">
			<div className="mx-auto max-w-7xl space-y-6">
				{/* Header */}
				<header className="text-center">
					<div className="mb-4 flex justify-between">
						<Link
							to="/admin"
							className="inline-flex items-center rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
						>
							← Back to Admin
						</Link>
					</div>
					<h1 className="mb-2 text-3xl font-bold text-gray-900">
						Status Duration Analytics
					</h1>
					<p className="text-gray-600">
						Time spent in each status (excluding Pre-Arrival and Picked Up)
					</p>
				</header>

				{/* Analytics Cards */}
				<div className="grid gap-6 md:grid-cols-3">
					{statuses.map((status) => {
						const statusInfo = getStatusDisplayInfo(status)
						const data = analytics[status]

						return (
							<div
								key={status}
								className={`rounded-lg border-2 ${statusInfo.borderColor} ${statusInfo.bgColor} p-6`}
							>
								<div className="mb-4">
									<h2 className={`text-xl font-semibold ${statusInfo.color}`}>
										{statusInfo.title}
									</h2>
									<p className="text-sm text-gray-600">
										{statusInfo.description}
									</p>
									<p className="mt-2 text-sm text-gray-500">
										Based on {data.count} completed transitions
									</p>
								</div>

								{data.count > 0 ? (
									<div className="space-y-4">
										{/* Statistics */}
										<div className="grid grid-cols-3 gap-4 text-center">
											<div>
												<div className="text-2xl font-bold text-gray-900">
													{formatDuration(data.min)}
												</div>
												<div className="text-xs text-gray-500">Minimum</div>
											</div>
											<div>
												<div className="text-2xl font-bold text-gray-900">
													{formatDuration(data.avg)}
												</div>
												<div className="text-xs text-gray-500">Average</div>
											</div>
											<div>
												<div className="text-2xl font-bold text-gray-900">
													{formatDuration(data.max)}
												</div>
												<div className="text-xs text-gray-500">Maximum</div>
											</div>
										</div>

										{/* Simple Bar Chart */}
										<div className="space-y-2">
											<div className="text-sm font-medium text-gray-700">
												Duration Comparison
											</div>
											<div className="space-y-1">
												{/* Min bar */}
												<div className="flex items-center space-x-2">
													<div className="w-8 text-xs text-gray-500">Min</div>
													<div className="h-2 flex-1 rounded-full bg-gray-200">
														<div
															className="h-2 rounded-full"
															style={{
																backgroundColor: statusInfo.chartColor,
																width: `${(data.min / data.max) * 100}%`,
															}}
														/>
													</div>
												</div>
												{/* Avg bar */}
												<div className="flex items-center space-x-2">
													<div className="w-8 text-xs text-gray-500">Avg</div>
													<div className="h-2 flex-1 rounded-full bg-gray-200">
														<div
															className="h-2 rounded-full"
															style={{
																backgroundColor: statusInfo.chartColor,
																width: `${(data.avg / data.max) * 100}%`,
																opacity: 0.8,
															}}
														/>
													</div>
												</div>
												{/* Max bar */}
												<div className="flex items-center space-x-2">
													<div className="w-8 text-xs text-gray-500">Max</div>
													<div className="h-2 flex-1 rounded-full bg-gray-200">
														<div
															className="h-2 rounded-full"
															style={{
																backgroundColor: statusInfo.chartColor,
																width: '100%',
																opacity: 0.6,
															}}
														/>
													</div>
												</div>
											</div>
										</div>
									</div>
								) : (
									<div className="py-8 text-center text-gray-500">
										No data available
										<br />
										<span className="text-xs">
											No cars have completed this status transition yet
										</span>
									</div>
								)}
							</div>
						)
					})}
				</div>

				{/* Summary Section */}
				<div className="rounded-lg border border-gray-200 bg-white p-6">
					<h3 className="mb-4 text-lg font-semibold text-gray-900">
						Overall Summary
					</h3>
					<div className="grid gap-4 md:grid-cols-3">
						{statuses.map((status) => {
							const statusInfo = getStatusDisplayInfo(status)
							const data = analytics[status]

							return (
								<div key={status} className="text-center">
									<div className={`text-lg font-semibold ${statusInfo.color}`}>
										{statusInfo.title}
									</div>
									<div className="text-2xl font-bold text-gray-900">
										{data.count > 0 ? formatDuration(data.avg) : 'N/A'}
									</div>
									<div className="text-sm text-gray-500">Average Duration</div>
								</div>
							)
						})}
					</div>
				</div>

				{/* Help Text */}
				<div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
					<div className="flex">
						<div className="flex-shrink-0">
							<svg
								className="h-5 w-5 text-blue-400"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fillRule="evenodd"
									d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
									clipRule="evenodd"
								/>
							</svg>
						</div>
						<div className="ml-3">
							<h3 className="text-sm font-medium text-blue-800">
								How to read this data
							</h3>
							<div className="mt-2 text-sm text-blue-700">
								<p>
									This analytics shows the time vehicles spend in each status
									before moving to the next one. Only completed status
									transitions are included in the calculations. PRE_ARRIVAL and
									PICKED_UP statuses are excluded as they represent the
									beginning and end of the process.
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</main>
	)
}
