import { useForm } from '@conform-to/react'
import type { SubmissionResult } from '@conform-to/react'
import { Form } from 'react-router'

interface SearchFormProps {
	placeholder?: string
	buttonText?: string
	lastResult?: SubmissionResult<string[]>
}

export function SearchForm({
	placeholder = 'Search by car ID or license plate...',
	buttonText = 'Search',
	lastResult,
}: SearchFormProps) {
	const [form, fields] = useForm({
		lastResult,
	})
	return (
		<Form method="post" className="space-y-4">
			<div className="flex gap-2">
				<input
					name={fields.searchTerm.name}
					placeholder={placeholder}
					className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-3 text-lg focus:border-transparent focus:ring-2 focus:ring-blue-500"
					required
				/>
				<button
					type="submit"
					className="rounded-lg bg-blue-600 px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-700"
				>
					{buttonText}
				</button>
			</div>
			{form.errors?.length && (
				<div className="rounded-lg border border-red-200 bg-red-50 p-3">
					{form.errors.map((error: string, index: number) => (
						<p key={index} className="text-sm text-red-600">
							{error}
						</p>
					))}
				</div>
			)}
		</Form>
	)
}
