import { Form } from 'react-router'

interface SearchFormProps {
	placeholder?: string
	buttonText?: string
}

export function SearchForm({
	placeholder = 'Search by car ID...',
	buttonText = 'Search',
}: SearchFormProps) {
	return (
		<Form method="post" className="space-y-4">
			<div className="flex gap-2">
				<input
					type="number"
					name="carId"
					placeholder={placeholder}
					className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-lg focus:border-transparent focus:ring-2 focus:ring-blue-500"
					min="1"
					required
				/>
				<button
					type="submit"
					className="rounded-lg bg-blue-600 px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-700"
				>
					{buttonText}
				</button>
			</div>
		</Form>
	)
}
