/**
 * Stats Overview Component
 * Financial health summary cards for the dashboard
 */

'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Briefcase, AlertCircle } from 'lucide-react'
import { JobWithRelations } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface StatsOverviewProps {
  jobs: JobWithRelations[]
}

export function StatsOverview({ jobs }: StatsOverviewProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Calculate real stats - use type assertion to access properties
  const activeJobs = jobs.filter(
    (j: any) => j.status !== 'Completed' && j.status !== 'Cancelled' && j.status !== 'Inquiry'
  ).length

  // Calculate overdue count (jobs with past dates that aren't completed)
  // Only calculate on client to avoid hydration mismatch
  const overdueCount = mounted
    ? (() => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return jobs.filter((j: any) => {
          if (!j.date) return false
          const jobDate = new Date(j.date)
          jobDate.setHours(0, 0, 0, 0)
          return jobDate < today && j.status !== 'Completed' && j.status !== 'Cancelled'
        }).length
      })()
    : 0

  // Calculate projected revenue (Booked + Shooting jobs)
  const projectedRevenue = jobs
    .filter((j: any) => j.status === 'Booked' || j.status === 'Shooting')
    .reduce((acc, curr: any) => acc + (parseFloat(curr.price?.toString() || '0') || 0), 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <StatCard
        label="Active Shoots"
        value={activeJobs}
        icon={<Briefcase className="w-5 h-5 text-blue-600" />}
        bg="bg-blue-50"
      />
      <StatCard
        label="Projected Revenue"
        value={formatCurrency(projectedRevenue)}
        icon={<DollarSign className="w-5 h-5 text-green-600" />}
        bg="bg-green-50"
      />
      <StatCard
        label="Action Needed"
        value={`${overdueCount} Overdue`}
        icon={<AlertCircle className="w-5 h-5 text-amber-600" />}
        bg="bg-amber-50"
        textColor="text-amber-700"
      />
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  bg: string
  textColor?: string
}

function StatCard({ label, value, icon, bg, textColor = 'text-gray-900' }: StatCardProps) {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-bold mt-1 ${textColor}`}>{value}</p>
      </div>
      <div className={`p-3 rounded-full ${bg}`}>{icon}</div>
    </div>
  )
}

