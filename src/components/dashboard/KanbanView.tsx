/**
 * Enhanced Kanban View Component
 * Drag & drop board using the premium JobCard
 */

'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { JobWithRelations } from '@/types'
import { JobCard } from './JobCard'
import { EmptyState } from './EmptyState'

interface KanbanViewProps {
  jobs: JobWithRelations[]
  onJobClick?: (id: string) => void
}

const columns = [
  { id: 'Inquiry', title: 'Inquiry', color: 'bg-gray-100' },
  { id: 'Booked', title: 'Booked', color: 'bg-blue-100' },
  { id: 'Shooting', title: 'Shooting', color: 'bg-purple-100' },
  { id: 'Editing', title: 'Editing', color: 'bg-yellow-100' },
  { id: 'Review', title: 'Review', color: 'bg-orange-100' },
  { id: 'Delivered', title: 'Delivered', color: 'bg-green-100' },
  { id: 'Completed', title: 'Completed', color: 'bg-green-200' },
]

export function KanbanView({ jobs, onJobClick }: KanbanViewProps) {
  const queryClient = useQueryClient()
  const [draggedJob, setDraggedJob] = useState<string | null>(null)

  const handleDragStart = (jobId: string) => {
    setDraggedJob(jobId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    if (!draggedJob) return

    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: newStatus as any })
        .eq('id', draggedJob)

      if (error) throw error

      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    } catch (error) {
      console.error('Failed to update job status:', error)
    } finally {
      setDraggedJob(null)
    }
  }

  const getJobsByStatus = (status: string) => {
    return jobs.filter((job) => job.status === status)
  }

  const hasAnyJobs = jobs.length > 0

  if (!hasAnyJobs) {
    return <EmptyState type="empty" />
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {columns.map((column) => {
          const columnJobs = getJobsByStatus(column.id)
          return (
            <div
              key={column.id}
              className="flex-shrink-0 w-80"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className={`${column.color} rounded-lg p-4 mb-2`}>
                <h3 className="text-card-title font-semibold mb-1">{column.title}</h3>
                <p className="text-caption text-text-muted">{columnJobs.length} jobs</p>
              </div>

              <div className="space-y-3 min-h-[400px]">
                {columnJobs.length === 0 ? (
                  <div className="text-center py-8 text-sm text-gray-400">
                    No jobs in this column
                  </div>
                ) : (
                  columnJobs.map((job) => (
                    <div
                      key={job.id}
                      draggable
                      onDragStart={() => handleDragStart(job.id)}
                      className="cursor-move"
                    >
                      <JobCard job={job} onClick={onJobClick} />
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

