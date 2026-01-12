/**
 * Kanban Board Component
 * Visual workflow board for tracking jobs
 */

'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import Card from '@/components/ui/Card'
import { JobWithRelations } from '@/types'
import { formatDate } from '@/lib/utils'
import { Calendar, MapPin, DollarSign } from 'lucide-react'

interface KanbanBoardProps {
  jobs: JobWithRelations[]
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

export default function KanbanBoard({ jobs }: KanbanBoardProps) {
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
        .update({ status: newStatus })
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
    return jobs.filter(job => job.status === status)
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
                {columnJobs.map((job) => (
                  <div
                    key={job.id}
                    draggable
                    onDragStart={() => handleDragStart(job.id)}
                    className="cursor-move"
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <h4 className="text-card-title text-primary mb-2">
                        {job.title || `${job.clients?.name || 'Untitled'} - ${formatDate(job.date)}`}
                      </h4>
                      
                      <div className="space-y-2 text-caption text-text-muted">
                        {job.date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(job.date)}</span>
                          </div>
                        )}
                        
                        {job.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{job.location}</span>
                          </div>
                        )}
                        
                        {job.price && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-3 h-3" />
                            <span>${job.price.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

