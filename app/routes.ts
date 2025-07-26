import { index, route } from '@react-router/dev/routes'
import type { RouteConfig } from '@react-router/dev/routes'

const routes: RouteConfig = [
	index('routes/_index/route.tsx'),
	route('registration', 'routes/registration/route.tsx'),
	route('registration/:carId', 'routes/registration.$carId/route.tsx'),
	route('floor', 'routes/floor/route.tsx'),
	route('floor/:carId', 'routes/floor.$carId/route.tsx'),
	route('handoff', 'routes/handoff/route.tsx'),
	route('handoff/:carId', 'routes/handoff.$carId/route.tsx'),
]

// Only include test hooks in development
if (import.meta.env.MODE === 'development') {
	routes.push(route('test-hooks/sql', 'routes/test-hooks.sql.tsx'))
}

export default routes
