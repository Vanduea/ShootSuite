/**
 * Create Invoice Page
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { ArrowLeft, FileText } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

async function getJob(id: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('jobs')
    .select('*, clients(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) throw error
  return data
}

export default function CreateInvoicePage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const jobId = params.id as string

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => getJob(jobId),
    enabled: !!jobId,
  })

  const [formData, setFormData] = useState({
    total_amount: '',
    due_date: '',
  })
  const [error, setError] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    if (job) {
      setFormData({
        total_amount: job.price?.toString() || '',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      })
    }
  }, [job])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsCreating(true)

    try {
      const { data: newInvoice, error: insertError } = await supabase
        .from('invoices')
        .insert({
          job_id: jobId,
          total_amount: parseFloat(formData.total_amount),
          due_date: formData.due_date || null,
          status: 'Draft',
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Send invoice email to client if email exists
      if (job?.clients?.email && newInvoice) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
        const portalUrl = `${appUrl}/p/${jobId}`
        
        try {
          await fetch('/api/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'invoice',
              clientEmail: job.clients.email,
              clientName: job.clients.name || 'Client',
              invoiceNumber: newInvoice.invoice_number || '',
              amount: parseFloat(formData.total_amount),
              portalUrl,
            }),
          })
        } catch (emailError) {
          // Don't fail invoice creation if email fails
          console.error('Failed to send invoice email:', emailError)
        }
      }

      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['job', jobId] })
      router.push(`/dashboard/jobs/${jobId}`)
    } catch (err: any) {
      setError(err.message || 'Failed to create invoice')
    } finally {
      setIsCreating(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <p className="text-body text-text-muted">Loading...</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Link href={`/dashboard/jobs/${jobId}`} className="inline-flex items-center text-body text-secondary hover:underline">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Job
      </Link>

      <h1 className="text-app-title text-primary">Create Invoice</h1>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-body text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-card-title text-text-dark mb-2">
                Job
              </label>
              <div className="p-3 bg-bg-light rounded-lg">
                <p className="text-body text-text-dark">
                  {job?.title || `${job?.clients?.name || 'Untitled'} - ${job?.date ? new Date(job.date).toLocaleDateString() : ''}`}
                </p>
                <p className="text-caption text-text-muted mt-1">
                  Client: {job?.clients?.name}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-card-title text-text-dark mb-2">
                Total Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary"
                placeholder="0.00"
                value={formData.total_amount}
                onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                required
                disabled={isCreating}
              />
              {job?.price && (
                <p className="text-caption text-text-muted mt-1">
                  Job price: {formatCurrency(parseFloat(job.price))}
                </p>
              )}
            </div>

            <div>
              <label className="block text-card-title text-text-dark mb-2">
                Due Date
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                disabled={isCreating}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              type="submit"
              variant="primary"
              isLoading={isCreating}
            >
              <FileText className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
            <Link href={`/dashboard/jobs/${jobId}`}>
              <Button type="button" variant="tertiary">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  )
}

