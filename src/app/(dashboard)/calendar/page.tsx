/**
 * Calendar View Page
 */

'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
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

export default function CalendarPage() {
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: getJobs,
  })

  const [currentDate, setCurrentDate] = useState(new Date())
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  const startingDayOfWeek = firstDayOfMonth.getDay()

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const getJobsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return jobs.filter(job => job.date === dateStr)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const today = new Date()
  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString()
  }

  const renderCalendar = () => {
    const days = []
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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
          const todayClass = isToday(date) ? 'ring-2 ring-secondary' : ''
          
          weekDays.push(
            <div
              key={dayCount}
              className={`aspect-square border border-border-gray rounded-lg p-1 ${todayClass} ${
                dayJobs.length > 0 ? 'bg-blue-50' : 'bg-white'
              }`}
            >
              <div className="text-caption text-text-dark font-medium mb-1">
                {dayCount}
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

    return days
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-app-title text-primary">Calendar</h1>
      </div>

      <Card>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-bg-light rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-text-dark" />
            </button>
            <h2 className="text-section-header text-primary">
              {monthNames[month]} {year}
            </h2>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-bg-light rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-text-dark" />
            </button>
          </div>
          {renderCalendar()}
        </div>
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

