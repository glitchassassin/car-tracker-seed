import { createRequestHandler } from 'react-router'
import { createCarDB } from '../app/lib/car-db'
import { CarUpdatesServer } from '../app/lib/car-updates'

declare module 'react-router' {
	export interface AppLoadContext {
		cloudflare: {
			env: Env
			ctx: ExecutionContext
		}
		carDB: ReturnType<typeof createCarDB>
	}
}

const requestHandler = createRequestHandler(
	() => import('virtual:react-router/server-build'),
	import.meta.env.MODE,
)

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url)

		// Handle WebSocket connections for car updates
		if (url.pathname === '/api/car-updates') {
			const upgradeHeader = request.headers.get('Upgrade')
			if (!upgradeHeader || upgradeHeader !== 'websocket') {
				return new Response('Expected Upgrade: websocket', { status: 426 })
			}

			// Forward to the Durable Object
			const id = env.CAR_UPDATES.idFromName('car-updates')
			const stub = env.CAR_UPDATES.get(id)
			return stub.fetch(request)
		}

		return requestHandler(request, {
			cloudflare: { env, ctx },
			carDB: createCarDB(env),
		})
	},
} satisfies ExportedHandler<Env>

export { CarUpdatesServer }
