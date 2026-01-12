/**
 * Client Detail Page
 */

'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { ArrowLeft, Edit, Trash2, Mail, Phone, Building, MapPin, FileText, Camera } from 'lucide-react'
import { useState } from 'react'

async function getClient(id: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('clients')
    .select('*, jobs(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) throw error
  return data
}

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const clientId = params.id as string
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { data: client, isLoading, error } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => getClient(clientId),
    enabled: !!clientId,
  })

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      // Check if client has jobs
      if (client?.jobs && client.jobs.length > 0) {
        alert('Cannot delete client with existing jobs. Please delete or reassign jobs first.')
        setIsDeleting(false)
        setShowDeleteConfirm(false)
        return
      }

      const { error: deleteError } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)

      if (deleteError) throw deleteError

      queryClient.invalidateQueries({ queryKey: ['clients'] })
      router.push('/dashboard/clients')
    } catch (err: any) {
      alert(err.message || 'Failed to delete client')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <p className="text-body text-text-muted">Loading client...</p>
        </Card>
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="space-y-6">
        <Card>
          <p className="text-body text-red-600">Client not found or error loading client.</p>
          <Link href="/dashboard/clients">
            <Button variant="primary" className="mt-4">
              Back to Clients
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/clients" className="inline-flex items-center text-body text-secondary hover:underline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Clients
        </Link>
        <div className="flex gap-2">
          <Link href={`/dashboard/clients/${clientId}/edit`}>
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

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <Card className="border-red-200 bg-red-50">
          <h3 className="text-card-title text-red-900 mb-2">Delete Client?</h3>
          <p className="text-body text-red-700 mb-4">
            {client.jobs && client.jobs.length > 0
              ? `This client has ${client.jobs.length} job(s). Please delete or reassign jobs first.`
              : 'This action cannot be undone.'}
          </p>
          <div className="flex gap-2">
            {(!client.jobs || client.jobs.length === 0) && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleDelete}
                isLoading={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Client
              </Button>
            )}
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

      {/* Client Name */}
      <h1 className="text-app-title text-primary">{client.name}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <Card>
            <h2 className="text-section-header text-primary mb-4">Contact Information</h2>
            <div className="space-y-4">
              {client.email && (
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-secondary mt-0.5" />
                  <div>
                    <p className="text-caption text-text-muted">Email</p>
                    <a href={`mailto:${client.email}`} className="text-body text-secondary hover:underline">
                      {client.email}
                    </a>
                  </div>
                </div>
              )}

              {client.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-secondary mt-0.5" />
                  <div>
                    <p className="text-caption text-text-muted">Phone</p>
                    <a href={`tel:${client.phone}`} className="text-body text-secondary hover:underline">
                      {client.phone}
                    </a>
                  </div>
                </div>
              )}

              {client.company && (
                <div className="flex items-start gap-3">
                  <Building className="w-5 h-5 text-secondary mt-0.5" />
                  <div>
                    <p className="text-caption text-text-muted">Company</p>
                    <p className="text-body text-text-dark">{client.company}</p>
                  </div>
                </div>
              )}

              {client.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-secondary mt-0.5" />
                  <div>
                    <p className="text-caption text-text-muted">Address</p>
                    <p className="text-body text-text-dark whitespace-pre-wrap">{client.address}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Notes */}
          {client.notes && (
            <Card>
              <h2 className="text-section-header text-primary mb-4">Notes</h2>
              <p className="text-body text-text-dark whitespace-pre-wrap">{client.notes}</p>
            </Card>
          )}

          {/* Jobs */}
          {client.jobs && client.jobs.length > 0 && (
            <Card>
              <h2 className="text-section-header text-primary mb-4">Jobs ({client.jobs.length})</h2>
              <div className="space-y-2">
                {client.jobs.map((job: any) => (
                  <Link
                    key={job.id}
                    href={`/dashboard/jobs/${job.id}`}
                    className="block p-3 rounded border border-border-gray hover:bg-bg-light transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-card-title text-primary">
                          {job.title || `Job - ${new Date(job.date).toLocaleDateString()}`}
                        </p>
                        <p className="text-caption text-text-muted">
                          {new Date(job.date).toLocaleDateString()} • {job.status}
                        </p>
                      </div>
                      {job.price && (
                        <p className="text-body text-text-dark font-medium">
                          ${parseFloat(job.price).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <h2 className="text-section-header text-primary mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link href={`/dashboard/jobs/new?client_id=${clientId}`} className="block">
                <Button variant="primary" className="w-full" size="sm">
                  <Camera className="w-4 h-4 mr-2" />
                  New Job
                </Button>
              </Link>
            </div>
          </Card>

          {/* Stats */}
          <Card>
            <h2 className="text-section-header text-primary mb-4">Statistics</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-body text-text-muted">Total Jobs</span>
                <span className="text-body text-text-dark font-medium">
                  {client.jobs?.length || 0}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

