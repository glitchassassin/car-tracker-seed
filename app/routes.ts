import { index, route } from '@react-router/dev/routes'
import type { RouteConfig } from '@react-router/dev/routes'

const routes: RouteConfig = [
	index('routes/_index.tsx'),
	route('registration', 'routes/registration.tsx'),
	route('pickup', 'routes/pickup.tsx'),
	route('projector', 'routes/projector.tsx'),
	route('admin', 'routes/admin.tsx'),
	route('admin/new', 'routes/admin.new.tsx'),
	route('admin/:carId', 'routes/admin.$carId.tsx'),
	route('admin/:carId/edit', 'routes/admin.$carId.edit.tsx'),
	route(':path/:carId', 'routes/status.$carId.tsx'),
]

// Only include test hooks in development
if (import.meta.env.MODE === 'development') {
	routes.push(route('test-hooks/sql', 'routes/test-hooks.sql.tsx'))
}

export default routes
