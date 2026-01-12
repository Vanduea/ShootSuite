/**
 * Dashboard Page
 * Main dashboard with Kanban board, Calendar, and overview
 * Command Center integrating Premium Job Card, Kanban Board, Calendar, and Financial Stats
 */

'use client'

import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ControlBar } from '@/components/dashboard/ControlBar'
import { JobWithRelations } from '@/types'

// Dynamically import components with no SSR to avoid hydration issues
const StatsOverview = dynamic(() => import('@/components/dashboard/StatsOverview').then(mod => ({ default: mod.StatsOverview })), {
  ssr: false,
  loading: () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm animate-pulse">
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  )
})

const KanbanView = dynamic(() => import('@/components/dashboard/KanbanView').then(mod => ({ default: mod.KanbanView })), {
  ssr: false,
  loading: () => <div className="p-8 text-center text-body text-text-muted">Loading board...</div>
})

const CalendarView = dynamic(() => import('@/components/dashboard/CalendarView').then(mod => ({ default: mod.CalendarView })), {
  ssr: false,
  loading: () => <div className="p-8 text-center text-body text-text-muted">Loading calendar...</div>
})

async function getJobs() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('jobs')
    .select('*, clients(*)')
    .eq('user_id', user.id)
    .order('date', { ascending: true })

  if (error) throw error
  return (data || []) as JobWithRelations[]
}

export default function DashboardPage() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'kanban' | 'calendar'>('kanban')
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch Data (Supabase)
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: getJobs,
  })

  // Client-side Filtering
  const filteredJobs = useMemo(() => {
    if (!searchTerm) return jobs

    const term = searchTerm.toLowerCase()
    return jobs.filter(
      (job) =>
        ((job.clients as any)?.name || '').toLowerCase().includes(term) ||
        (job.title || '').toLowerCase().includes(term) ||
        (job.location || '').toLowerCase().includes(term)
    )
  }, [jobs, searchTerm])

  // Handlers
  const handleJobClick = (id: string) => {
    router.push(`/dashboard/jobs/${id}`)
  }

  const handleNewJob = () => {
    router.push('/dashboard/jobs/new')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50 p-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="p-8 text-center">
            <p className="text-body text-text-muted">Loading Dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Top Header */}
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back, here is what's happening today.</p>
        </header>

        {/* Financial Stats */}
        <StatsOverview jobs={jobs} />

        {/* Controls */}
        <ControlBar
          viewMode={viewMode}
          setViewMode={setViewMode}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onNewJob={handleNewJob}
        />

        {/* Main View Area */}
        <div className="h-[calc(100vh-300px)] overflow-auto">
          {viewMode === 'kanban' ? (
            <KanbanView jobs={filteredJobs} onJobClick={handleJobClick} />
          ) : (
            <CalendarView jobs={filteredJobs} onJobClick={handleJobClick} onAddJob={handleNewJob} />
          )}
        </div>
      </div>
    </div>
  )
}

