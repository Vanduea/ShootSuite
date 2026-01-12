/**
 * Job Detail Page
 * View and manage individual job
 */

'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { ArrowLeft, Edit, Trash2, Calendar, MapPin, DollarSign, Clock, Package, FileText, Camera } from 'lucide-react'
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils'
import { useState } from 'react'

async function getJob(id: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('jobs')
    .select('*, clients(*), invoices(*), payments(*), expenses(*), tasks(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) throw error
  return data
}

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const jobId = params.id as string
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { data: job, isLoading, error } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => getJob(jobId),
    enabled: !!jobId,
  })

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId)

      if (error) throw error

      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      router.push('/dashboard/jobs')
    } catch (err: any) {
      alert(err.message || 'Failed to delete job')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <p className="text-body text-text-muted">Loading job...</p>
        </Card>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="space-y-6">
        <Card>
          <p className="text-body text-red-600">Job not found or error loading job.</p>
          <Link href="/dashboard/jobs">
            <Button variant="primary" className="mt-4">
              Back to Jobs
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  const totalExpenses = job.expenses?.reduce((sum: number, exp: any) => sum + parseFloat(exp.amount || 0), 0) || 0
  const totalPaid = job.payments?.filter((p: any) => p.status === 'Completed').reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0) || 0
  const profit = parseFloat(job.price || 0) - totalExpenses

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/jobs" className="inline-flex items-center text-body text-secondary hover:underline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Jobs
        </Link>
        <div className="flex gap-2">
          <Link href={`/dashboard/jobs/${jobId}/edit`}>
            <Button variant="secondary" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button
            variant="tertiary"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <Card className="border-red-200 bg-red-50">
          <h3 className="text-card-title text-red-900 mb-2">Delete Job?</h3>
          <p className="text-body text-red-700 mb-4">
            This action cannot be undone. All associated data (invoices, payments, expenses) will also be deleted.
          </p>
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleDelete}
              isLoading={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Job
            </Button>
            <Button
              variant="tertiary"
              size="sm"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Job Title and Status */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-app-title text-primary mb-2">
            {job.title || `${job.clients?.name || 'Untitled'} - ${formatDate(job.date)}`}
          </h1>
          <span className={`inline-block px-3 py-1 rounded text-caption font-medium ${getStatusColor(job.status)}`}>
            {job.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview */}
          <Card>
            <h2 className="text-section-header text-primary mb-4">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-secondary mt-0.5" />
                <div>
                  <p className="text-caption text-text-muted">Date</p>
                  <p className="text-body text-text-dark">{formatDate(job.date)}</p>
                  {job.start_time && job.end_time && (
                    <p className="text-caption text-text-muted mt-1">
                      {job.start_time} - {job.end_time}
                    </p>
                  )}
                </div>
              </div>

              {job.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-secondary mt-0.5" />
                  <div>
                    <p className="text-caption text-text-muted">Location</p>
                    <p className="text-body text-text-dark">{job.location}</p>
                  </div>
                </div>
              )}

              {job.package_type && (
                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-secondary mt-0.5" />
                  <div>
                    <p className="text-caption text-text-muted">Package</p>
                    <p className="text-body text-text-dark">{job.package_type}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-secondary mt-0.5" />
                <div>
                  <p className="text-caption text-text-muted">Price</p>
                  <p className="text-body text-text-dark">{formatCurrency(parseFloat(job.price || 0))}</p>
                  {job.deposit_amount && (
                    <p className="text-caption text-text-muted mt-1">
                      Deposit: {formatCurrency(parseFloat(job.deposit_amount))}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {job.notes && (
              <div className="mt-4 pt-4 border-t border-border-gray">
                <p className="text-caption text-text-muted mb-2">Notes</p>
                <p className="text-body text-text-dark whitespace-pre-wrap">{job.notes}</p>
              </div>
            )}
          </Card>

          {/* Client Info */}
          {job.clients && (
            <Card>
              <h2 className="text-section-header text-primary mb-4">Client</h2>
              <div className="space-y-2">
                <p className="text-card-title text-text-dark">{job.clients.name}</p>
                {job.clients.email && (
                  <p className="text-body text-text-muted">{job.clients.email}</p>
                )}
                {job.clients.phone && (
                  <p className="text-body text-text-muted">{job.clients.phone}</p>
                )}
                <Link href={`/dashboard/clients/${job.clients.id}`}>
                  <Button variant="tertiary" size="sm" className="mt-2">
                    View Client
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          {/* Tasks */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-section-header text-primary">Tasks</h2>
              <div className="flex gap-2">
                <Link href={`/dashboard/jobs/${jobId}/tasks`}>
                  <Button variant="tertiary" size="sm">
                    Manage Tasks
                  </Button>
                </Link>
                <Link href={`/dashboard/jobs/${jobId}/team`}>
                  <Button variant="tertiary" size="sm">
                    Team
                  </Button>
                </Link>
              </div>
            </div>
            {job.tasks && job.tasks.length > 0 ? (
              <div className="space-y-2">
                {job.tasks.slice(0, 5).map((task: any) => (
                  <div key={task.id} className="flex items-center gap-2 p-2 rounded border border-border-gray">
                    <input
                      type="checkbox"
                      checked={task.is_done}
                      readOnly
                      className="rounded"
                    />
                    <span className={`text-body ${task.is_done ? 'text-text-muted line-through' : 'text-text-dark'}`}>
                      {task.description}
                    </span>
                  </div>
                ))}
                {job.tasks.length > 5 && (
                  <Link href={`/dashboard/jobs/${jobId}/tasks`} className="text-caption text-secondary hover:underline">
                    View all {job.tasks.length} tasks →
                  </Link>
                )}
              </div>
            ) : (
              <p className="text-body text-text-muted">No tasks yet.</p>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Financial Summary */}
          <Card>
            <h2 className="text-section-header text-primary mb-4">Financial Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-body text-text-muted">Total Price</span>
                <span className="text-body text-text-dark font-medium">{formatCurrency(parseFloat(job.price || 0))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-body text-text-muted">Total Paid</span>
                <span className="text-body text-text-dark font-medium">{formatCurrency(totalPaid)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-body text-text-muted">Expenses</span>
                <span className="text-body text-text-muted">{formatCurrency(totalExpenses)}</span>
              </div>
              <div className="pt-3 border-t border-border-gray flex justify-between">
                <span className="text-card-title text-text-dark">Profit</span>
                <span className={`text-card-title font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(profit)}
                </span>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card>
            <h2 className="text-section-header text-primary mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {job.invoices && job.invoices.length > 0 ? (
                <Link href={`/dashboard/jobs/${jobId}/invoice/generate?id=${job.invoices[0].id}`} className="block">
                  <Button variant="secondary" className="w-full" size="sm">
                    Generate PDF
                  </Button>
                </Link>
              ) : (
                <Link href={`/dashboard/jobs/${jobId}/invoice`} className="block">
                  <Button variant="secondary" className="w-full" size="sm">
                    Create Invoice
                  </Button>
                </Link>
              )}
              <Link href={`/dashboard/jobs/${jobId}/payment`} className="block">
                <Button variant="secondary" className="w-full" size="sm">
                  Record Payment
                </Button>
              </Link>
              <Link href={`/dashboard/jobs/${jobId}/expense`} className="block">
                <Button variant="tertiary" className="w-full" size="sm">
                  Add Expense
                </Button>
              </Link>
              <Link href={`/dashboard/jobs/${jobId}/deliverable`} className="block">
                <Button variant="tertiary" className="w-full" size="sm">
                  Add Deliverable
                </Button>
              </Link>
              <Link href={`/dashboard/jobs/${jobId}/deliverables`} className="block">
                <Button variant="tertiary" className="w-full" size="sm">
                  Manage Deliverables
                </Button>
              </Link>
              <Link href={`/dashboard/jobs/${jobId}/portal`} className="block">
                <Button variant="tertiary" className="w-full" size="sm">
                  Client Portal
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

