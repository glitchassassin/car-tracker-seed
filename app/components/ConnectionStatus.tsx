import { useCarUpdatesContext } from '../contexts/CarUpdatesContext'

export function ConnectionStatus() {
	const { connectionStatus, isConnected } = useCarUpdatesContext()

	// Only show when there are connection issues
	if (connectionStatus === 'connected' && isConnected) {
		return null
	}

	const getStatusText = () => {
		switch (connectionStatus) {
			case 'connecting':
				return 'Connecting...'
			case 'connected':
				return 'Connected'
			case 'disconnected':
				return 'Disconnected'
			case 'reconnecting':
				return 'Reconnecting...'
			default:
				return 'Unknown'
		}
	}

	const getStatusColor = () => {
		switch (connectionStatus) {
			case 'connecting':
			case 'reconnecting':
				return 'bg-yellow-100 text-yellow-800 border-yellow-200'
			case 'connected':
				return 'bg-green-100 text-green-800 border-green-200'
			case 'disconnected':
				return 'bg-red-100 text-red-800 border-red-200'
			default:
				return 'bg-gray-100 text-gray-800 border-gray-200'
		}
	}

	return (
		<div
			className={`fixed top-4 right-4 rounded-lg border px-3 py-2 text-sm font-medium ${getStatusColor()} z-50`}
		>
			{getStatusText()}
		</div>
	)
}
