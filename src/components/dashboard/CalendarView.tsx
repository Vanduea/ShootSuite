/**
 * Calendar View Component
 * Reusable calendar component for dashboard
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, AlertTriangle, Plus } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { JobWithRelations } from '@/types'
import Card from '@/components/ui/Card'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface CalendarViewProps {
  jobs: JobWithRelations[]
  onJobClick?: (id: string) => void
  onAddJob?: (date?: Date) => void
}

interface ConflictInfo {
  type: 'timeslot' | 'assigned_person'
  jobs: JobWithRelations[]
  message: string
  suggestion: string
}

export function CalendarView({ jobs, onJobClick, onAddJob }: CalendarViewProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [currentDate, setCurrentDate] = useState<Date | null>(null)
  const [userType, setUserType] = useState<'freelancer' | 'company' | null>(null)
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)
  const [conflictDetails, setConflictDetails] = useState<Record<string, ConflictInfo[]>>({})

  useEffect(() => {
    setMounted(true)
    setCurrentDate(new Date())
    
    // Fetch user type
    const fetchUserType = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('user_type')
          .eq('id', user.id)
          .single()
        if (profile) {
          setUserType(profile.user_type as 'freelancer' | 'company' | null)
        }
      }
    }
    fetchUserType()
  }, [])

  // Initialize with a date to ensure server and client render the same initially
  // Use a fixed date for initial render to avoid hydration mismatch
  const displayDate = currentDate || new Date()

  const year = displayDate.getFullYear()
  const month = displayDate.getMonth()

  // Enhanced conflict detection based on user type
  const conflicts = useMemo(() => {
    const conflictMap: Record<string, JobWithRelations[]> = {}
    const details: Record<string, ConflictInfo[]> = {}

    jobs.forEach((job) => {
      if (!job.date) return

      const jobDate = new Date(job.date)
      const dateKey = jobDate.toISOString().split('T')[0]

      if (!conflictMap[dateKey]) {
        conflictMap[dateKey] = []
      }

      conflictMap[dateKey].push(job)
    })

    // Find dates with multiple jobs and detect specific conflicts
    const conflicts: Record<string, JobWithRelations[]> = {}
    
    Object.entries(conflictMap).forEach(([date, jobsOnDate]) => {
      if (jobsOnDate.length > 1) {
        conflicts[date] = jobsOnDate
        const dateConflicts: ConflictInfo[] = []

        if (userType === 'freelancer') {
          // Check for overlapping timeslots
          for (let i = 0; i < jobsOnDate.length; i++) {
            for (let j = i + 1; j < jobsOnDate.length; j++) {
              const job1 = jobsOnDate[i] as any
              const job2 = jobsOnDate[j] as any
              
              if (job1.start_time && job1.end_time && job2.start_time && job2.end_time) {
                // Check if timeslots overlap
                const start1 = job1.start_time
                const end1 = job1.end_time
                const start2 = job2.start_time
                const end2 = job2.end_time
                
                if ((start1 <= start2 && end1 > start2) || (start2 <= start1 && end2 > start1)) {
                  dateConflicts.push({
                    type: 'timeslot',
                    jobs: [job1, job2],
                    message: `Timeslot conflict: ${job1.title || 'Job 1'} (${start1}-${end1}) overlaps with ${job2.title || 'Job 2'} (${start2}-${end2})`,
                    suggestion: `Please adjust the time for one of these jobs to avoid overlap.`
                  })
                }
              }
            }
          }
        } else if (userType === 'company') {
          // Check for same assigned person (via team_members)
          // We'll need to fetch team members for these jobs
          // For now, we'll check if jobs have the same team members
          // This is a simplified check - in production, you'd fetch team_members
          const jobIds = jobsOnDate.map(j => j.id)
          // Note: This would require fetching team_members separately
          // For now, we'll show a generic warning
          if (jobsOnDate.length > 1) {
            dateConflicts.push({
              type: 'assigned_person',
              jobs: jobsOnDate,
              message: `Multiple jobs scheduled on the same day`,
              suggestion: `Please ensure different team members are assigned to avoid conflicts.`
            })
          }
        }

        if (dateConflicts.length > 0) {
          details[date] = dateConflicts
        }
      }
    })

    setConflictDetails(details)
    return conflicts
  }, [jobs, userType])

  const getJobsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return jobs.filter((job) => job.date === dateStr)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      if (!prev) return new Date()
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  // Only calculate today after mount to avoid hydration mismatch
  // On initial render (server and client), isToday will always return false
  const isToday = (date: Date) => {
    if (!mounted) return false
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const renderCalendar = () => {
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    const daysInMonth = lastDayOfMonth.getDate()
    const startingDayOfWeek = firstDayOfMonth.getDay()
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ]

    const days = []

    // Day headers
    days.push(
      <div key="headers" className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
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

          const dateKey = date.toISOString().split('T')[0]
          const isHovered = hoveredDate === dateKey
          const dateConflicts = conflictDetails[dateKey] || []

          weekDays.push(
            <div
              key={dayCount}
              className={`aspect-square border border-border-gray rounded-lg p-1 relative group ${todayClass} ${conflictClass} ${
                dayJobs.length > 0 && !hasConflict ? 'bg-blue-50' : 'bg-white'
              }`}
              onMouseEnter={() => setHoveredDate(dateKey)}
              onMouseLeave={() => setHoveredDate(null)}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="text-caption text-text-dark font-medium">{dayCount}</div>
                <div className="flex items-center gap-1">
                  {hasConflict && <AlertTriangle className="w-3 h-3 text-red-600" />}
                  {isHovered && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (onAddJob) {
                          onAddJob(date)
                        } else {
                          router.push(`/dashboard/jobs/new?date=${dateKey}`)
                        }
                      }}
                      className="w-5 h-5 bg-secondary text-white rounded-full flex items-center justify-center hover:bg-secondary/80 transition-colors opacity-0 group-hover:opacity-100"
                      title="Add new job"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              {dayJobs.slice(0, 2).map((job) => {
                const clientName = ((job.clients as any)?.name) || ((job as any).client?.name) || 'Unknown'
                return (
                  <Link
                    key={job.id}
                    href={`/dashboard/jobs/${job.id}`}
                    className="block text-caption text-secondary truncate hover:underline"
                  >
                    {job.title || clientName || 'Job'}
                  </Link>
                )
              })}
              {dayJobs.length > 2 && (
                <div className="text-caption text-text-muted">+{dayJobs.length - 2} more</div>
              )}
              
              {/* Conflict tooltip */}
              {isHovered && dateConflicts.length > 0 && (
                <div className="absolute z-10 bottom-full left-0 mb-2 w-64 p-3 bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-800 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-yellow-900 mb-1">Schedule Conflict</p>
                      {dateConflicts.map((conflict, idx) => (
                        <div key={idx} className="mb-2 last:mb-0">
                          <p className="text-xs text-yellow-800 mb-1">{conflict.message}</p>
                          <p className="text-xs text-yellow-700 italic">{conflict.suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
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
        {days}
      </div>
    )
  }

  // Always render the calendar structure to avoid hydration mismatch
  // The date will be consistent between server and client on initial render
  return (
    <Card>
      <div suppressHydrationWarning>
        {renderCalendar()}
        
        {/* Conflict Warning - only show after mount to avoid hydration issues */}
        {mounted && Object.keys(conflicts).length > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <p className="text-body font-medium">
                Schedule Conflicts: {Object.keys(conflicts).length} date(s) with multiple jobs
              </p>
            </div>
            {Object.entries(conflictDetails).length > 0 && (
              <div className="mt-2 space-y-2">
                {Object.entries(conflictDetails).map(([date, conflicts]) => (
                  <div key={date} className="text-sm text-yellow-700">
                    <p className="font-medium">{formatDate(new Date(date))}:</p>
                    {conflicts.map((conflict, idx) => (
                      <div key={idx} className="ml-4 text-xs">
                        <p>• {conflict.message}</p>
                        <p className="italic ml-2">{conflict.suggestion}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

