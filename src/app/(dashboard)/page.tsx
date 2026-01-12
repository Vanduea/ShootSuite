/**
 * Dashboard Page
 * Main dashboard with Kanban board and overview
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import { Calendar, DollarSign, Camera, TrendingUp } from 'lucide-react'
import KanbanBoard from '@/components/kanban/KanbanBoard'

async function getJobs() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('jobs')
    .select('*, clients(*)')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  if (error) throw error
  return data || []
}

export default function DashboardPage() {
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: getJobs,
  })

  // Calculate stats
  const stats = {
    total: jobs.length,
    booked: jobs.filter(j => j.status === 'Booked').length,
    inProgress: jobs.filter(j => ['Shooting', 'Editing', 'Review'].includes(j.status)).length,
    completed: jobs.filter(j => j.status === 'Completed').length,
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption text-text-muted">Total Jobs</p>
              <p className="text-section-header text-primary mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Camera className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption text-text-muted">Booked</p>
              <p className="text-section-header text-secondary mt-1">{stats.booked}</p>
            </div>
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-secondary" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption text-text-muted">In Progress</p>
              <p className="text-section-header text-secondary mt-1">{stats.inProgress}</p>
            </div>
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-secondary" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption text-text-muted">Completed</p>
              <p className="text-section-header text-primary mt-1">{stats.completed}</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>
      </div>

      {/* Kanban Board */}
      <div>
        <h2 className="text-section-header text-primary mb-4">Workflow Board</h2>
        {isLoading ? (
          <Card>
            <p className="text-body text-text-muted">Loading jobs...</p>
          </Card>
        ) : (
          <KanbanBoard jobs={jobs} />
        )}
      </div>
    </div>
  )
}

