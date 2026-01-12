/**
 * Add Deliverable Page
 * Phase 1: Link Wrapper (Option A)
 */

'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { ArrowLeft, Link as LinkIcon } from 'lucide-react'
import Link from 'next/link'

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

export default function AddDeliverablePage() {
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
    external_url: '',
    password: '',
    expires_at: '',
  })
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSaving(true)

    try {
      // Check if invoice is paid
      const { data: invoices } = await supabase
        .from('invoices')
        .select('balance')
        .eq('job_id', jobId)

      const totalBalance = invoices?.reduce((sum, inv) => sum + parseFloat(inv.balance || 0), 0) || 0
      const isLocked = totalBalance > 0

      const { error: insertError } = await supabase
        .from('deliverables')
        .insert({
          job_id: jobId,
          method: 'external_link',
          external_url: formData.external_url,
          provider: 'None',
          is_locked: isLocked,
          password: formData.password || null,
          expires_at: formData.expires_at || null,
        })

      if (insertError) throw insertError

      // Send deliverable ready email if unlocked
      if (!isLocked && job?.clients?.email) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
        const portalUrl = `${appUrl}/p/${jobId}`
        
        try {
          await fetch('/api/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'deliverable_ready',
              clientEmail: job.clients.email,
              clientName: job.clients.name || 'Client',
              portalUrl,
            }),
          })
        } catch (emailError) {
          // Don't fail deliverable creation if email fails
          console.error('Failed to send deliverable email:', emailError)
        }
      }

      queryClient.invalidateQueries({ queryKey: ['job', jobId] })
      router.push(`/dashboard/jobs/${jobId}`)
    } catch (err: any) {
      setError(err.message || 'Failed to add deliverable')
    } finally {
      setIsSaving(false)
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

      <h1 className="text-app-title text-primary">Add Deliverable</h1>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-body text-red-600">{error}</p>
            </div>
          )}

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-body text-blue-800">
              <strong>Link Wrapper Mode:</strong> Paste a link from WeTransfer, Pixieset, or any file sharing service.
              The link will be locked until payment is complete.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-card-title text-text-dark mb-2">
                Delivery URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary"
                placeholder="https://wetransfer.com/..."
                value={formData.external_url}
                onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
                required
                disabled={isSaving}
              />
              <p className="text-caption text-text-muted mt-1">
                Supported: WeTransfer, Pixieset, Google Drive shared links, Dropbox links, etc.
              </p>
            </div>

            <div>
              <label className="block text-card-title text-text-dark mb-2">
                Password (Optional)
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary"
                placeholder="Optional password protection"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="block text-card-title text-text-dark mb-2">
                Expiry Date (Optional)
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                disabled={isSaving}
              />
              <p className="text-caption text-text-muted mt-1">
                Link will expire after this date (default: 90 days)
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              type="submit"
              variant="primary"
              isLoading={isSaving}
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              Add Deliverable
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

