import {
	createContext,
	useContext,
	useEffect,
	useRef,
	useState,
	useCallback,
} from 'react'
import type { ReactNode } from 'react'
import type { CarStatus } from '../lib/car-db'
import { carUpdateMessageSchema } from '../lib/validation'
import type { CarStatusUpdate } from '../lib/validation'

interface CarUpdateEvent {
	carId: number
	oldStatus: string
	newStatus: string
	timestamp: string
}

interface CarUpdatesContextType {
	subscribe: (callback: (update: CarUpdateEvent) => void) => () => void
	isConnected: boolean
}

const CarUpdatesContext = createContext<CarUpdatesContextType | null>(null)

interface CarUpdatesProviderProps {
	children: ReactNode
}

export function CarUpdatesProvider({ children }: CarUpdatesProviderProps) {
	const [isConnected, setIsConnected] = useState(false)
	const wsRef = useRef<WebSocket | null>(null)
	const reconnectTimeoutRef = useRef<number | null>(null)
	const subscribersRef = useRef<Set<(update: CarUpdateEvent) => void>>(
		new Set(),
	)

	const connect = useCallback(() => {
		try {
			// Create WebSocket connection to the car updates endpoint
			const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
			const wsUrl = `${protocol}//${window.location.host}/api/car-updates`
			const ws = new WebSocket(wsUrl)

			ws.onopen = () => {
				console.log('Connected to car updates WebSocket')
				setIsConnected(true)
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

					// Notify all subscribers
					subscribersRef.current.forEach((callback) => {
						try {
							callback(update)
						} catch (error) {
							console.error('Error in subscriber callback:', error)
						}
					})
				} catch (error) {
					console.error('Error parsing WebSocket message:', error)
				}
			}

			ws.onclose = (event) => {
				console.log('WebSocket connection closed:', event.code, event.reason)
				setIsConnected(false)

				// Attempt to reconnect after a delay
				if (event.code !== 1000) {
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
	}, [])

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

	const subscribe = useCallback(
		(callback: (update: CarUpdateEvent) => void) => {
			subscribersRef.current.add(callback)

			// Return unsubscribe function
			return () => {
				subscribersRef.current.delete(callback)
			}
		},
		[],
	)

	// Connect on mount
	useEffect(() => {
		connect()

		// Cleanup on unmount
		return () => {
			disconnect()
		}
	}, [connect, disconnect])

	const contextValue: CarUpdatesContextType = {
		subscribe,
		isConnected,
	}

	return (
		<CarUpdatesContext.Provider value={contextValue}>
			{children}
		</CarUpdatesContext.Provider>
	)
}

export function useCarUpdatesContext() {
	const context = useContext(CarUpdatesContext)
	if (!context) {
		throw new Error(
			'useCarUpdatesContext must be used within a CarUpdatesProvider',
		)
	}
	return context
}
