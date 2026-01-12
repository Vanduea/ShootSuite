/**
 * Edit Job Page
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

async function getJob(id: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) throw error
  return data
}

async function getClients() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

  if (error) throw error
  return data || []
}

export default function EditJobPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const jobId = params.id as string

  const { data: job, isLoading: jobLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => getJob(jobId),
    enabled: !!jobId,
  })

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
  })

  const [formData, setFormData] = useState({
    client_id: '',
    title: '',
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    package_type: '',
    price: '',
    deposit_amount: '',
    notes: '',
    status: 'Inquiry',
  })
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (job) {
      setFormData({
        client_id: job.client_id || '',
        title: job.title || '',
        date: job.date || '',
        start_time: job.start_time || '',
        end_time: job.end_time || '',
        location: job.location || '',
        package_type: job.package_type || '',
        price: job.price?.toString() || '',
        deposit_amount: job.deposit_amount?.toString() || '',
        notes: job.notes || '',
        status: job.status || 'Inquiry',
      })
    }
  }, [job])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSaving(true)

    try {
      const { error: updateError } = await supabase
        .from('jobs')
        .update({
          client_id: formData.client_id,
          title: formData.title || null,
          date: formData.date,
          start_time: formData.start_time || null,
          end_time: formData.end_time || null,
          location: formData.location || null,
          package_type: formData.package_type || null,
          price: parseFloat(formData.price),
          deposit_amount: formData.deposit_amount ? parseFloat(formData.deposit_amount) : null,
          notes: formData.notes || null,
          status: formData.status,
        })
        .eq('id', jobId)

      if (updateError) throw updateError

      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['job', jobId] })
      router.push(`/dashboard/jobs/${jobId}`)
    } catch (err: any) {
      setError(err.message || 'Failed to update job')
    } finally {
      setIsSaving(false)
    }
  }

  if (jobLoading) {
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

      <h1 className="text-app-title text-primary">Edit Job</h1>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-body text-red-600">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-card-title text-text-dark mb-2">
                Client <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary"
                value={formData.client_id}
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                required
                disabled={isSaving}
              >
                <option value="">Select a client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-card-title text-text-dark mb-2">
                Status
              </label>
              <select
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                disabled={isSaving}
              >
                <option value="Inquiry">Inquiry</option>
                <option value="Booked">Booked</option>
                <option value="Shooting">Shooting</option>
                <option value="Editing">Editing</option>
                <option value="Review">Review</option>
                <option value="Delivered">Delivered</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-card-title text-text-dark mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="block text-card-title text-text-dark mb-2">Title</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary"
                placeholder="e.g., Wedding - John & Jane"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="block text-card-title text-text-dark mb-2">Package Type</label>
              <select
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary"
                value={formData.package_type}
                onChange={(e) => setFormData({ ...formData, package_type: e.target.value })}
                disabled={isSaving}
              >
                <option value="">Select package</option>
                <option value="Wedding">Wedding</option>
                <option value="Portrait">Portrait</option>
                <option value="Event">Event</option>
                <option value="Commercial">Commercial</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-card-title text-text-dark mb-2">
                Price <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="block text-card-title text-text-dark mb-2">Deposit Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary"
                placeholder="0.00"
                value={formData.deposit_amount}
                onChange={(e) => setFormData({ ...formData, deposit_amount: e.target.value })}
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="block text-card-title text-text-dark mb-2">Start Time</label>
              <input
                type="time"
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="block text-card-title text-text-dark mb-2">End Time</label>
              <input
                type="time"
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                disabled={isSaving}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-card-title text-text-dark mb-2">Location</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary"
                placeholder="Venue name and address"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                disabled={isSaving}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-card-title text-text-dark mb-2">Notes</label>
              <textarea
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary min-h-[100px]"
                placeholder="Additional notes about this job..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              type="submit"
              variant="primary"
              isLoading={isSaving}
            >
              Save Changes
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

