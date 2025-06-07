import { index, route } from '@react-router/dev/routes'
import type { RouteConfig } from '@react-router/dev/routes'

const routes: RouteConfig = [index('routes/_index/route.tsx')]

// Only include test hooks in development
if (import.meta.env.MODE === 'development') {
	routes.push(route('test-hooks/sql', 'routes/test-hooks.sql.tsx'))
}

export default routes
