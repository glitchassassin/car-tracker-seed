import { useEffect, useCallback } from 'react'
import { useRevalidator } from 'react-router'
import { useCarUpdatesContext } from '../contexts/CarUpdatesContext'
import type { CarStatus } from '../lib/car-db'

interface UseRevalidateOnCarUpdatesOptions {
	/**
	 * Statuses to listen for. If provided, only updates involving any of these statuses will trigger revalidation.
	 * Can be either the old or new status in the update.
	 */
	statusFilter?: CarStatus[]
	/**
	 * Specific car ID to listen for. If provided, only updates for this car will trigger revalidation.
	 */
	carIdFilter?: number
	/**
	 * Whether to enable the subscription. Defaults to true.
	 */
	enabled?: boolean
}

export function useRevalidateOnCarUpdates(
	options: UseRevalidateOnCarUpdatesOptions = {},
) {
	const { statusFilter, carIdFilter, enabled = true } = options
	const revalidator = useRevalidator()
	const { subscribe } = useCarUpdatesContext()

	const handleUpdate = useCallback(
		(update: {
			carId: number
			oldStatus: string
			newStatus: string
			timestamp: string
		}) => {
			// Check if this update matches our filters
			const matchesStatus =
				!statusFilter ||
				statusFilter.includes(update.oldStatus as CarStatus) ||
				statusFilter.includes(update.newStatus as CarStatus)

			const matchesCarId = !carIdFilter || update.carId === carIdFilter

			if (matchesStatus && matchesCarId) {
				console.log('Car status update received:', update)

				// Trigger revalidation to refresh the data
				void revalidator.revalidate()
			}
		},
		[statusFilter, carIdFilter, revalidator],
	)

	// Subscribe to updates when the component mounts or filters change
	useEffect(() => {
		if (!enabled) return

		const unsubscribe = subscribe(handleUpdate)

		// Cleanup subscription when component unmounts or dependencies change
		return unsubscribe
	}, [enabled, subscribe, handleUpdate])
}
