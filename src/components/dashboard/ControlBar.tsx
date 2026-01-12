/**
 * Control Bar Component
 * Search, filters, and view toggle controls
 */

'use client'

import { Search, LayoutGrid, Calendar as CalIcon, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ControlBarProps {
  viewMode: 'kanban' | 'calendar'
  setViewMode: (mode: 'kanban' | 'calendar') => void
  searchTerm: string
  setSearchTerm: (term: string) => void
  onNewJob?: () => void
}

export function ControlBar({
  viewMode,
  setViewMode,
  searchTerm,
  setSearchTerm,
  onNewJob,
}: ControlBarProps) {
  const router = useRouter()

  const handleNewJob = () => {
    if (onNewJob) {
      onNewJob()
    } else {
      router.push('/dashboard/jobs/new')
    }
  }

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
      {/* 1. View Toggles */}
      <div className="bg-gray-100 p-1 rounded-lg flex gap-1">
        <button
          onClick={() => setViewMode('kanban')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
            viewMode === 'kanban'
              ? 'bg-white shadow-sm text-gray-900'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <LayoutGrid size={16} /> Board
        </button>
        <button
          onClick={() => setViewMode('calendar')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
            viewMode === 'calendar'
              ? 'bg-white shadow-sm text-gray-900'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <CalIcon size={16} /> Calendar
        </button>
      </div>

      {/* 2. Search & Actions */}
      <div className="flex gap-3 w-full sm:w-auto">
        <div className="relative flex-1 sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
          />
        </div>
        <button
          onClick={handleNewJob}
          className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-800 transition-colors whitespace-nowrap"
        >
          <Plus size={16} /> New Job
        </button>
      </div>
    </div>
  )
}

