/**
 * Calendar View Page
 * Enhanced with weekly/daily views and conflict detection
 */

'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

async function getJobs() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('jobs')
    .select('*, clients(*)')
    .eq('user_id', user.id)
    .order('date', { ascending: true })

  if (error) throw error
  return data || []
}

type ViewMode = 'month' | 'week' | 'day'

export default function CalendarPage() {
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: getJobs,
  })

  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const day = currentDate.getDate()

  // Conflict detection
  const conflicts = useMemo(() => {
    const conflictMap: Record<string, any[]> = {}
    
    jobs.forEach((job, index) => {
      if (!job.date) return
      
      const jobDate = new Date(job.date)
      const dateKey = jobDate.toISOString().split('T')[0]
      
      if (!conflictMap[dateKey]) {
        conflictMap[dateKey] = []
      }
      
      conflictMap[dateKey].push(job)
    })
    
    // Find dates with multiple jobs (conflicts)
    const conflicts: Record<string, any[]> = {}
    Object.entries(conflictMap).forEach(([date, jobsOnDate]) => {
      if (jobsOnDate.length > 1) {
        conflicts[date] = jobsOnDate
      }
    })
    
    return conflicts
  }, [jobs])

  const getJobsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return jobs.filter(job => job.date === dateStr)
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (viewMode === 'month') {
        if (direction === 'prev') {
          newDate.setMonth(prev.getMonth() - 1)
        } else {
          newDate.setMonth(prev.getMonth() + 1)
        }
      } else if (viewMode === 'week') {
        const days = direction === 'prev' ? -7 : 7
        newDate.setDate(prev.getDate() + days)
      } else {
        const days = direction === 'prev' ? -1 : 1
        newDate.setDate(prev.getDate() + days)
      }
      return newDate
    })
  }

  const today = new Date()
  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString()
  }

  const renderMonthView = () => {
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    const daysInMonth = lastDayOfMonth.getDate()
    const startingDayOfWeek = firstDayOfMonth.getDay()
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]

    const days = []
    
    // Day headers
    days.push(
      <div key="headers" className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="text-caption text-text-muted font-medium text-center py-2">
            {day}
          </div>
        ))}
      </div>
    )

    // Calendar days
    let dayCount = 1
    for (let week = 0; week < 6; week++) {
      const weekDays = []
      for (let day = 0; day < 7; day++) {
        if (week === 0 && day < startingDayOfWeek) {
          weekDays.push(<div key={`empty-${day}`} className="aspect-square" />)
        } else if (dayCount <= daysInMonth) {
          const date = new Date(year, month, dayCount)
          const dayJobs = getJobsForDate(date)
          const dateKey = date.toISOString().split('T')[0]
          const hasConflict = conflicts[dateKey] && conflicts[dateKey].length > 1
          const todayClass = isToday(date) ? 'ring-2 ring-secondary' : ''
          const conflictClass = hasConflict ? 'bg-red-50 border-red-300' : ''
          
          weekDays.push(
            <div
              key={dayCount}
              className={`aspect-square border border-border-gray rounded-lg p-1 ${todayClass} ${conflictClass} ${
                dayJobs.length > 0 && !hasConflict ? 'bg-blue-50' : 'bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="text-caption text-text-dark font-medium">
                  {dayCount}
                </div>
                {hasConflict && (
                  <AlertTriangle className="w-3 h-3 text-red-600" />
                )}
              </div>
              {dayJobs.slice(0, 2).map(job => (
                <Link
                  key={job.id}
                  href={`/dashboard/jobs/${job.id}`}
                  className="block text-caption text-secondary truncate hover:underline"
                >
                  {job.title || job.clients?.name || 'Job'}
                </Link>
              ))}
              {dayJobs.length > 2 && (
                <div className="text-caption text-text-muted">
                  +{dayJobs.length - 2} more
                </div>
              )}
            </div>
          )
          dayCount++
        } else {
          weekDays.push(<div key={`empty-${day}`} className="aspect-square" />)
        }
      }
      days.push(
        <div key={week} className="grid grid-cols-7 gap-1">
          {weekDays}
        </div>
      )
      if (dayCount > daysInMonth) break
    }

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 hover:bg-bg-light rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-text-dark" />
          </button>
          <h2 className="text-section-header text-primary">
            {monthNames[month]} {year}
          </h2>
          <button
            onClick={() => navigateDate('next')}
            className="p-2 hover:bg-bg-light rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-text-dark" />
          </button>
        </div>
        {days}
      </div>
    )
  }

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate)
    const day = startOfWeek.getDay()
    startOfWeek.setDate(startOfWeek.getDate() - day)
    
    const weekDays = []
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      const dayJobs = getJobsForDate(date)
      const dateKey = date.toISOString().split('T')[0]
      const hasConflict = conflicts[dateKey] && conflicts[dateKey].length > 1
      
      weekDays.push(
        <div key={i} className="border border-border-gray rounded-lg p-3 min-h-[200px]">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-caption text-text-muted">{dayNames[i]}</p>
              <p className={`text-body font-medium ${isToday(date) ? 'text-secondary' : 'text-text-dark'}`}>
                {date.getDate()}
              </p>
            </div>
            {hasConflict && (
              <AlertTriangle className="w-4 h-4 text-red-600" />
            )}
          </div>
          <div className="space-y-1">
            {dayJobs.map(job => (
              <Link
                key={job.id}
                href={`/dashboard/jobs/${job.id}`}
                className="block p-2 bg-blue-50 rounded text-caption text-secondary hover:bg-blue-100"
              >
                {job.title || job.clients?.name || 'Job'}
              </Link>
            ))}
          </div>
        </div>
      )
    }

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 hover:bg-bg-light rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-text-dark" />
          </button>
          <h2 className="text-section-header text-primary">
            Week of {formatDate(startOfWeek)}
          </h2>
          <button
            onClick={() => navigateDate('next')}
            className="p-2 hover:bg-bg-light rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-text-dark" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekDays}
        </div>
      </div>
    )
  }

  const renderDayView = () => {
    const dayJobs = getJobsForDate(currentDate)
    const dateKey = currentDate.toISOString().split('T')[0]
    const hasConflict = conflicts[dateKey] && conflicts[dateKey].length > 1

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 hover:bg-bg-light rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-text-dark" />
          </button>
          <h2 className="text-section-header text-primary">
            {formatDate(currentDate)}
          </h2>
          <button
            onClick={() => navigateDate('next')}
            className="p-2 hover:bg-bg-light rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-text-dark" />
          </button>
        </div>
        
        {hasConflict && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              <p className="text-body font-medium">Schedule Conflict Detected</p>
            </div>
            <p className="text-caption text-red-700 mt-1">
              You have {dayJobs.length} jobs scheduled on this date.
            </p>
          </div>
        )}

        <div className="space-y-2">
          {dayJobs.length === 0 ? (
            <p className="text-body text-text-muted text-center py-8">No jobs scheduled for this day.</p>
          ) : (
            dayJobs.map(job => (
              <Link
                key={job.id}
                href={`/dashboard/jobs/${job.id}`}
                className="block p-4 border border-border-gray rounded-lg hover:bg-bg-light transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-card-title text-primary">
                      {job.title || `${job.clients?.name || 'Untitled'} - ${formatDate(job.date)}`}
                    </p>
                    <p className="text-caption text-text-muted">
                      {job.location || 'No location'} • {job.clients?.name || 'No client'}
                    </p>
                  </div>
                  <span className="text-caption px-2 py-1 rounded bg-blue-100 text-blue-800">
                    {job.status}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-app-title text-primary">Calendar</h1>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'month' ? 'primary' : 'tertiary'}
            size="sm"
            onClick={() => setViewMode('month')}
          >
            Month
          </Button>
          <Button
            variant={viewMode === 'week' ? 'primary' : 'tertiary'}
            size="sm"
            onClick={() => setViewMode('week')}
          >
            Week
          </Button>
          <Button
            variant={viewMode === 'day' ? 'primary' : 'tertiary'}
            size="sm"
            onClick={() => setViewMode('day')}
          >
            Day
          </Button>
        </div>
      </div>

      {/* Conflict Warning */}
      {Object.keys(conflicts).length > 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="w-5 h-5" />
            <p className="text-body font-medium">
              Schedule Conflicts Detected: {Object.keys(conflicts).length} date(s) with multiple jobs
            </p>
          </div>
        </Card>
      )}

      <Card>
        {isLoading ? (
          <p className="text-body text-text-muted">Loading...</p>
        ) : (
          <>
            {viewMode === 'month' && renderMonthView()}
            {viewMode === 'week' && renderWeekView()}
            {viewMode === 'day' && renderDayView()}
          </>
        )}
      </Card>

      {/* Upcoming Jobs */}
      <Card>
        <h2 className="text-section-header text-primary mb-4">Upcoming Jobs</h2>
        {isLoading ? (
          <p className="text-body text-text-muted">Loading...</p>
        ) : jobs.length === 0 ? (
          <p className="text-body text-text-muted">No upcoming jobs.</p>
        ) : (
          <div className="space-y-2">
            {jobs.slice(0, 5).map(job => (
              <Link
                key={job.id}
                href={`/dashboard/jobs/${job.id}`}
                className="block p-3 rounded border border-border-gray hover:bg-bg-light transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-card-title text-primary">
                      {job.title || `${job.clients?.name || 'Untitled'} - ${formatDate(job.date)}`}
                    </p>
                    <p className="text-caption text-text-muted">
                      {formatDate(job.date)} • {job.location || 'No location'}
                    </p>
                  </div>
                  <span className="text-caption px-2 py-1 rounded bg-blue-100 text-blue-800">
                    {job.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
