/**
 * Premium Job Card Component
 * Reusable card with badges, urgent dates, and quick actions
 */

'use client'

import { useState, useEffect } from 'react'
import { Calendar, MapPin, MoreHorizontal } from 'lucide-react'
import { formatDistanceToNow, isPast } from 'date-fns'
import clsx from 'clsx'
import { JobWithRelations } from '@/types'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

interface JobCardProps {
  job: JobWithRelations
  onClick?: (id: string) => void
  onMenuClick?: (id: string) => void
}

export function JobCard({ job, onClick, onMenuClick }: JobCardProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const jobDate = job.date ? new Date(job.date) : null
  // Only calculate isOverdue on client to avoid hydration mismatch
  const isOverdue = mounted && jobDate && isPast(jobDate) && job.status !== 'Completed' && job.status !== 'Cancelled'

  // Get client name - handle both possible structures
  const clientName =
    ((job.clients as any)?.name) ||
    ((job as any).client?.name) ||
    'Unknown Client'

  // Payment Status Badge Logic
  // Note: We'll need to calculate payment status from invoices/payments
  // For now, using a placeholder based on job status
  const getPaymentStatus = () => {
    // This would ideally come from invoice data
    // For now, return a default
    return 'unpaid'
  }

  const paymentStatus = getPaymentStatus()
  
  const badgeColors = {
    paid: 'bg-green-100 text-green-700 border-green-200',
    unpaid: 'bg-red-50 text-red-700 border-red-200',
    partially_paid: 'bg-amber-50 text-amber-700 border-amber-200',
  }

  const handleClick = () => {
    if (onClick) {
      onClick(job.id)
    }
  }

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onMenuClick) {
      onMenuClick(job.id)
    }
  }

  const price = parseFloat(job.price?.toString() || '0') || 0

  return (
    <Link href={`/dashboard/jobs/${job.id}`}>
      <div
        onClick={handleClick}
        className="group bg-white rounded-xl p-3 shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer relative"
      >
        {/* 1. Status Indicator Strip */}
        <div
          className={clsx(
            'absolute left-0 top-3 bottom-3 w-1 rounded-r-md',
            isOverdue ? 'bg-red-500' : 'bg-blue-500'
          )}
        />

        <div className="pl-3">
          {/* 2. Header */}
          <div className="flex justify-between items-start mb-1">
            <h4 className="font-semibold text-gray-900 truncate pr-2">
              {clientName}
            </h4>
            {onMenuClick && (
              <button
                onClick={handleMenuClick}
                className="text-gray-400 hover:text-gray-700 p-1 -mr-2 -mt-1 rounded-md hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal size={16} />
              </button>
            )}
          </div>

          {/* 3. Job Title & Price */}
          <p className="text-xs text-gray-500 mb-2">{job.title || 'Untitled Job'}</p>

          {/* 4. Metadata */}
          <div className="space-y-1.5">
            {jobDate && mounted && (
              <div
                className={clsx(
                  'flex items-center gap-1.5 text-xs',
                  isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'
                )}
              >
                <Calendar size={12} />
                <span>
                  {formatDistanceToNow(jobDate, { addSuffix: true })}
                </span>
              </div>
            )}
            {jobDate && !mounted && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Calendar size={12} />
                <span>Loading...</span>
              </div>
            )}
            {job.location && (
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <MapPin size={12} />
                <span className="truncate">{job.location}</span>
              </div>
            )}
          </div>

          {/* 5. Footer: Badge & Price */}
          <div className="mt-3 pt-2 border-t border-gray-50 flex justify-between items-center">
            <span
              className={clsx(
                'text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase',
                badgeColors[paymentStatus as keyof typeof badgeColors] || badgeColors.unpaid
              )}
            >
              {paymentStatus.replace('_', ' ') || 'Unpaid'}
            </span>
            <span className="text-xs font-bold text-gray-700">
              {formatCurrency(price)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

