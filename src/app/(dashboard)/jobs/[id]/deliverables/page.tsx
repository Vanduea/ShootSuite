/**
 * Manage Deliverables Page
 */

'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { ArrowLeft, Plus, ExternalLink, Lock, Unlock, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

async function getJob(id: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('jobs')
    .select('*, deliverables(*), invoices(*), clients(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) throw error
  return data
}

export default function ManageDeliverablesPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const jobId = params.id as string

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => getJob(jobId),
    enabled: !!jobId,
  })

  const handleToggleLock = async (deliverableId: string, currentLocked: boolean) => {
    try {
      const { error } = await supabase
        .from('deliverables')
        .update({ is_locked: !currentLocked })
        .eq('id', deliverableId)

      if (error) throw error

      // Send email if unlocking (was locked, now unlocked) and client email exists
      if (currentLocked && job?.clients?.email) {
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
          // Don't fail unlock if email fails
          console.error('Failed to send deliverable email:', emailError)
        }
      }

      queryClient.invalidateQueries({ queryKey: ['job', jobId] })
    } catch (err: any) {
      alert(err.message || 'Failed to update deliverable')
    }
  }

  const handleDelete = async (deliverableId: string) => {
    if (!confirm('Delete this deliverable?')) return

    try {
      const { error } = await supabase
        .from('deliverables')
        .delete()
        .eq('id', deliverableId)

      if (error) throw error

      queryClient.invalidateQueries({ queryKey: ['job', jobId] })
    } catch (err: any) {
      alert(err.message || 'Failed to delete deliverable')
    }
  }

  if (isLoading) {
    return (
      <Card>
        <p className="text-body text-text-muted">Loading...</p>
      </Card>
    )
  }

  const deliverables = job?.deliverables || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href={`/dashboard/jobs/${jobId}`} className="inline-flex items-center text-body text-secondary hover:underline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Job
        </Link>
        <Link href={`/dashboard/jobs/${jobId}/deliverable`}>
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            Add Deliverable
          </Button>
        </Link>
      </div>

      <h1 className="text-app-title text-primary">Manage Deliverables</h1>

      {deliverables.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-body text-text-muted mb-4">
              No deliverables yet. Add your first deliverable link.
            </p>
            <Link href={`/dashboard/jobs/${jobId}/deliverable`}>
              <Button variant="primary">Add Deliverable</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {deliverables.map((deliverable: any) => (
            <Card key={deliverable.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <ExternalLink className="w-4 h-4 text-secondary" />
                    <h3 className="text-card-title text-primary">External Link</h3>
                    {deliverable.is_locked ? (
                      <span className="px-2 py-1 rounded text-caption bg-red-100 text-red-800 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Locked
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded text-caption bg-green-100 text-green-800 flex items-center gap-1">
                        <Unlock className="w-3 h-3" />
                        Unlocked
                      </span>
                    )}
                  </div>

                  <a
                    href={deliverable.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-body text-secondary hover:underline break-all"
                  >
                    {deliverable.external_url}
                  </a>

                  <div className="mt-3 space-y-1 text-caption text-text-muted">
                    {deliverable.password && (
                      <p>Password: {deliverable.password}</p>
                    )}
                    {deliverable.expires_at && (
                      <p>Expires: {formatDate(deliverable.expires_at)}</p>
                    )}
                    <p>Access Count: {deliverable.download_count || 0}</p>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    variant="tertiary"
                    size="sm"
                    onClick={() => handleToggleLock(deliverable.id, deliverable.is_locked)}
                  >
                    {deliverable.is_locked ? (
                      <>
                        <Unlock className="w-4 h-4 mr-1" />
                        Unlock
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-1" />
                        Lock
                      </>
                    )}
                  </Button>
                  <Button
                    variant="tertiary"
                    size="sm"
                    onClick={() => handleDelete(deliverable.id)}
                    className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

