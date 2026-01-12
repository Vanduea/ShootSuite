/**
 * Job Search Component
 */

'use client'

import { useState, useMemo } from 'react'
import { JobWithRelations } from '@/types'
import Input from '@/components/ui/Input'
import { Search, X } from 'lucide-react'

interface JobSearchProps {
  jobs: JobWithRelations[]
  onFilteredJobsChange?: (filtered: JobWithRelations[]) => void
}

export default function JobSearch({ jobs, onFilteredJobsChange }: JobSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [packageFilter, setPackageFilter] = useState<string>('all')

  const filteredJobs = useMemo(() => {
    let filtered = jobs

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(job => {
        const title = job.title?.toLowerCase() || ''
        const clientName = job.clients?.name?.toLowerCase() || ''
        const location = job.location?.toLowerCase() || ''
        const notes = job.notes?.toLowerCase() || ''
        
        return title.includes(term) || 
               clientName.includes(term) || 
               location.includes(term) ||
               notes.includes(term)
      })
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === statusFilter)
    }

    // Package filter
    if (packageFilter !== 'all') {
      filtered = filtered.filter(job => job.package_type === packageFilter)
    }

    if (onFilteredJobsChange) {
      onFilteredJobsChange(filtered)
    }

    return filtered
  }, [jobs, searchTerm, statusFilter, packageFilter, onFilteredJobsChange])

  const statuses = ['all', 'Inquiry', 'Booked', 'Shooting', 'Editing', 'Review', 'Delivered', 'Completed']
  const packages = ['all', 'Wedding', 'Portrait', 'Event', 'Commercial', 'Other']

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          placeholder="Search jobs by title, client, location..."
          className="w-full pl-10 pr-10 py-2 border border-border-gray rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text-dark"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-caption text-text-muted mb-1">Status</label>
          <select
            className="px-3 py-2 border border-border-gray rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {statuses.map(status => (
              <option key={status} value={status}>
                {status === 'all' ? 'All Statuses' : status}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-caption text-text-muted mb-1">Package</label>
          <select
            className="px-3 py-2 border border-border-gray rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary"
            value={packageFilter}
            onChange={(e) => setPackageFilter(e.target.value)}
          >
            {packages.map(pkg => (
              <option key={pkg} value={pkg}>
                {pkg === 'all' ? 'All Packages' : pkg}
              </option>
            ))}
          </select>
        </div>

        {(searchTerm || statusFilter !== 'all' || packageFilter !== 'all') && (
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setPackageFilter('all')
              }}
              className="px-3 py-2 text-body text-secondary hover:underline"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="text-caption text-text-muted">
        Showing {filteredJobs.length} of {jobs.length} jobs
      </div>
    </div>
  )
}

