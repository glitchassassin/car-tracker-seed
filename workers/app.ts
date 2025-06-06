import { createRequestHandler } from 'react-router'
import { createCarDB } from '../app/lib/car-db'

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
		return requestHandler(request, {
			cloudflare: { env, ctx },
			carDB: createCarDB(env),
		})
	},
} satisfies ExportedHandler<Env>
