import { useCarUpdatesContext } from '../contexts/CarUpdatesContext'
import { useNetworkStatus } from '../hooks/useNetworkStatus'

export function ConnectionStatus() {
	const { connectionStatus } = useCarUpdatesContext()
	const isOnline = useNetworkStatus()

	// Show when there are connection issues or when offline
	if (connectionStatus === 'connected' && isOnline) {
		return null
	}

	const getStatusText = () => {
		if (!isOnline) {
			return 'No Internet Connection'
		}

		switch (connectionStatus) {
			case 'connecting':
				return 'Connecting...'
			case 'disconnected':
				return 'Disconnected'
			default:
				return 'Unknown'
		}
	}

	return (
		<div
			className={`fixed top-4 right-4 z-50 rounded-lg border border-red-200 bg-red-100 px-3 py-2 text-sm font-medium text-red-800`}
			role="status"
			aria-live="polite"
			aria-label="Connection status"
		>
			{getStatusText()}
		</div>
	)
}
