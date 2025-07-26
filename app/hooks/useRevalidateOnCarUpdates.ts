import { useEffect, useRef, useCallback } from 'react'
import { useRevalidator } from 'react-router'
import type { CarStatus } from '../lib/car-db'
import { carUpdateMessageSchema } from '../lib/validation'
import type { CarStatusUpdate } from '../lib/validation'

interface UseRevalidateOnCarUpdatesOptions {
	/**
	 * Status to listen for. If provided, only updates involving this status will trigger revalidation.
	 * Can be either the old or new status in the update.
	 */
	statusFilter?: CarStatus
	/**
	 * Specific car ID to listen for. If provided, only updates for this car will trigger revalidation.
	 */
	carIdFilter?: number
	/**
	 * Whether to enable the WebSocket connection. Defaults to true.
	 */
	enabled?: boolean
}

export function useRevalidateOnCarUpdates(
	options: UseRevalidateOnCarUpdatesOptions = {},
) {
	const { statusFilter, carIdFilter, enabled = true } = options
	const revalidator = useRevalidator()
	const wsRef = useRef<WebSocket | null>(null)
	const reconnectTimeoutRef = useRef<number | null>(null)

	const connect = useCallback(() => {
		if (!enabled) return

		try {
			// Create WebSocket connection to the car updates endpoint
			const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
			const wsUrl = `${protocol}//${window.location.host}/api/car-updates`
			const ws = new WebSocket(wsUrl)

			ws.onopen = () => {
				console.log('Connected to car updates WebSocket')
			}

			ws.onmessage = (event) => {
				try {
					const rawData = JSON.parse(event.data)

					// Validate the message structure using Zod
					const validationResult = carUpdateMessageSchema.safeParse(rawData)

					if (!validationResult.success) {
						console.warn(
							'Invalid WebSocket message format:',
							validationResult.error,
						)
						return
					}

					const { data: update } = validationResult.data

					// Check if this update matches our filters
					const matchesStatus =
						!statusFilter ||
						update.oldStatus === statusFilter ||
						update.newStatus === statusFilter

					const matchesCarId = !carIdFilter || update.carId === carIdFilter

					if (matchesStatus && matchesCarId) {
						console.log('Car status update received:', update)

						// Trigger revalidation to refresh the data
						void revalidator.revalidate()
					}
				} catch (error) {
					console.error('Error parsing WebSocket message:', error)
				}
			}

			ws.onclose = (event) => {
				console.log('WebSocket connection closed:', event.code, event.reason)

				// Attempt to reconnect after a delay (unless disabled)
				if (enabled && event.code !== 1000) {
					reconnectTimeoutRef.current = window.setTimeout(() => {
						console.log('Attempting to reconnect...')
						connect()
					}, 3000) // 3 second delay
				}
			}

			ws.onerror = (error) => {
				console.error('WebSocket error:', error)
			}

			wsRef.current = ws
		} catch (error) {
			console.error('Failed to create WebSocket connection:', error)
		}
	}, [enabled, statusFilter, carIdFilter, revalidator])

	const disconnect = useCallback(() => {
		if (wsRef.current) {
			wsRef.current.close(1000, 'User disconnected')
			wsRef.current = null
		}

		if (reconnectTimeoutRef.current) {
			clearTimeout(reconnectTimeoutRef.current)
			reconnectTimeoutRef.current = null
		}
	}, [])

	// Connect on mount and when dependencies change
	useEffect(() => {
		connect()

		// Cleanup on unmount
		return () => {
			disconnect()
		}
	}, [connect, disconnect])

	// Cleanup when component unmounts
	useEffect(() => {
		return () => {
			disconnect()
		}
	}, [disconnect])

	return {
		isConnected: wsRef.current?.readyState === WebSocket.OPEN,
		disconnect,
		connect,
	}
}
