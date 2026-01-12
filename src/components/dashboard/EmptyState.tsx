/**
 * Empty State Component
 * Display when there are no jobs or search results
 */

'use client'

import { Inbox, Search } from 'lucide-react'

interface EmptyStateProps {
  type?: 'empty' | 'no-results'
  message?: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({
  type = 'empty',
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const Icon = type === 'no-results' ? Search : Inbox

  const defaultMessages = {
    empty: "You don't have any jobs yet. Create your first job to get started!",
    'no-results': "No jobs found matching your search. Try adjusting your filters.",
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {type === 'no-results' ? 'No Results Found' : 'No Jobs Yet'}
      </h3>
      <p className="text-sm text-gray-500 mb-6 max-w-sm">
        {message || defaultMessages[type]}
      </p>
      {onAction && actionLabel && (
        <button
          onClick={onAction}
          className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

