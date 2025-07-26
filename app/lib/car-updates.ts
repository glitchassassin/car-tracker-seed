import { DurableObject } from 'cloudflare:workers'
import { carStatusUpdateSchema } from './validation'
import type { CarStatusUpdate } from './validation'

export interface Env {
	CAR_UPDATES: DurableObjectNamespace<CarUpdatesServer>
}

/**
 * Durable Object for handling real-time car status updates via WebSocket
 */
export class CarUpdatesServer extends DurableObject {
	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url)

		// Handle broadcast endpoint for internal communication
		if (url.pathname === '/broadcast') {
			const rawData = await request.json()

			// Validate the update data using Zod
			const validationResult = carStatusUpdateSchema.safeParse(rawData)

			if (!validationResult.success) {
				console.error('Invalid car status update data:', validationResult.error)
				return new Response('Invalid data format', { status: 400 })
			}

			const update = validationResult.data
			await this.broadcastStatusUpdate(update)
			return new Response('OK', { status: 200 })
		}

		// Handle WebSocket upgrade requests
		const upgradeHeader = request.headers.get('Upgrade')
		if (!upgradeHeader || upgradeHeader !== 'websocket') {
			return new Response('Expected Upgrade: websocket', { status: 426 })
		}

		// Creates two ends of a WebSocket connection
		const webSocketPair = new WebSocketPair()
		const [client, server] = Object.values(webSocketPair)

		// Accept the WebSocket connection using hibernation API
		this.ctx.acceptWebSocket(server)

		return new Response(null, {
			status: 101,
			webSocket: client,
		})
	}

	async webSocketMessage(
		ws: WebSocket,
		message: string | ArrayBuffer,
	): Promise<void> {
		// Echo the message back to confirm receipt
		ws.send(`Received: ${message}`)
	}

	async webSocketClose(
		ws: WebSocket,
		code: number,
		reason: string,
		wasClean: boolean,
	): Promise<void> {
		console.log(`WebSocket closed: ${code} - ${reason}`)
	}

	async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
		console.error('WebSocket error:', error)
		ws.close(1011, 'WebSocket error')
	}

	/**
	 * Broadcast a car status update to all connected clients
	 */
	async broadcastStatusUpdate(update: CarStatusUpdate): Promise<void> {
		// Validate the update data before broadcasting
		const validationResult = carStatusUpdateSchema.safeParse(update)

		if (!validationResult.success) {
			console.error(
				'Invalid car status update data for broadcasting:',
				validationResult.error,
			)
			return
		}

		const message = JSON.stringify({
			type: 'car_status_update',
			data: validationResult.data,
		})

		const websockets = this.ctx.getWebSockets()
		websockets.forEach((ws) => {
			try {
				ws.send(message)
			} catch (error) {
				console.error('Failed to send message to WebSocket:', error)
			}
		})
	}
}

/**
 * Helper function to get the CarUpdatesServer Durable Object stub
 */
export function getCarUpdatesStub(
	env: Env,
): DurableObjectStub<CarUpdatesServer> {
	const id = env.CAR_UPDATES.idFromName('car-updates')
	return env.CAR_UPDATES.get(id)
}

/**
 * Helper function to broadcast a car status update
 */
export async function broadcastCarUpdate(
	env: Env,
	carId: number,
	oldStatus: string,
	newStatus: string,
): Promise<void> {
	const stub = getCarUpdatesStub(env)
	const update: CarStatusUpdate = {
		carId,
		oldStatus,
		newStatus,
		timestamp: new Date().toISOString(),
	}

	// Validate the update data before sending
	const validationResult = carStatusUpdateSchema.safeParse(update)

	if (!validationResult.success) {
		console.error('Invalid car status update data:', validationResult.error)
		throw new Error('Invalid car status update data')
	}

	await stub.fetch('http://internal/broadcast', {
		method: 'POST',
		body: JSON.stringify(validationResult.data),
	})
}
