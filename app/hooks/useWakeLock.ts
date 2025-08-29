import { useState, useEffect, useCallback, useRef } from 'react'

interface WakeLockSentinel {
	release: () => Promise<void>
}

export function useWakeLock() {
	const [isWakeLocked, setIsWakeLocked] = useState(false)
	const wakeLockRef = useRef<WakeLockSentinel | null>(null)

	const requestWakeLock = useCallback(async () => {
		try {
			// Check if the Wake Lock API is supported
			if ('wakeLock' in navigator) {
				const sentinel = await navigator.wakeLock.request('screen')
				wakeLockRef.current = sentinel
				setIsWakeLocked(true)

				// Listen for when the wake lock is released (e.g., when user switches tabs)
				sentinel.addEventListener('release', () => {
					setIsWakeLocked(false)
					wakeLockRef.current = null
				})

				return true
			}
		} catch (err) {
			console.warn('Failed to request wake lock:', err)
		}
		return false
	}, [])

	const releaseWakeLock = useCallback(async () => {
		if (wakeLockRef.current) {
			try {
				await wakeLockRef.current.release()
				wakeLockRef.current = null
				setIsWakeLocked(false)
			} catch (err) {
				console.warn('Failed to release wake lock:', err)
			}
		}
	}, [])

	useEffect(() => {
		// Request wake lock when the hook is first used
		void requestWakeLock()

		// Clean up wake lock when component unmounts
		return () => {
			if (wakeLockRef.current) {
				void releaseWakeLock()
			}
		}
	}, [requestWakeLock, releaseWakeLock])

	// Handle page visibility changes to re-request wake lock when page becomes visible
	useEffect(() => {
		const handleVisibilityChange = () => {
			if (!document.hidden && !isWakeLocked && !wakeLockRef.current) {
				void requestWakeLock()
			}
		}

		document.addEventListener('visibilitychange', handleVisibilityChange)
		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange)
		}
	}, [isWakeLocked, requestWakeLock])

	return {
		isWakeLocked,
		requestWakeLock,
		releaseWakeLock,
		isSupported: 'wakeLock' in navigator,
	}
}
