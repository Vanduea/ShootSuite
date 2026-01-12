/**
 * Create New Job Page
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

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

async function getJobs() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('jobs')
    .select('*, clients(*), team_members(*)')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  if (error) throw error
  return data || []
}

async function getUserProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('users')
    .select('user_type')
    .eq('id', user.id)
    .single()

  return data
}

export default function NewJobPageContent() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const clientIdParam = searchParams?.get('client_id') || ''
  const dateParam = searchParams?.get('date') || ''
  
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: getClients })
  const { data: existingJobs = [] } = useQuery({ queryKey: ['jobs'], queryFn: getJobs })
  const { data: userProfile } = useQuery({ queryKey: ['userProfile'], queryFn: getUserProfile })

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
    assigned_to: '', // For companies
  })

  const [conflictWarning, setConflictWarning] = useState<{ message: string; suggestion: string } | null>(null)

  useEffect(() => {
    if (clientIdParam) {
      setFormData(prev => ({ ...prev, client_id: clientIdParam }))
    }
    if (dateParam) {
      setFormData(prev => ({ ...prev, date: dateParam }))
    }
  }, [clientIdParam, dateParam])

  // Check for conflicts when date/time changes
  useEffect(() => {
    if (!formData.date || !userProfile) return

    const jobsOnDate = existingJobs.filter((j: any) => j.date === formData.date)
    if (jobsOnDate.length === 0) {
      setConflictWarning(null)
      return
    }

    if (userProfile.user_type === 'freelancer' && formData.start_time && formData.end_time) {
      // Check for timeslot overlap
      const hasOverlap = jobsOnDate.some((job: any) => {
        if (!job.start_time || !job.end_time) return false
        const newStart = formData.start_time
        const newEnd = formData.end_time
        const existingStart = job.start_time
        const existingEnd = job.end_time
        
        return (newStart <= existingStart && newEnd > existingStart) || 
               (existingStart <= newStart && existingEnd > newStart)
      })

      if (hasOverlap) {
        setConflictWarning({
          message: 'Timeslot conflict detected with existing booking(s) on this date.',
          suggestion: 'Please adjust the start or end time to avoid overlap.'
        })
      } else {
        setConflictWarning(null)
      }
    } else if (userProfile.user_type === 'company' && formData.assigned_to) {
      // Check if same person is assigned to another job on this date
      const hasSameAssignment = jobsOnDate.some((job: any) => {
        const teamMembers = job.team_members || []
        return teamMembers.some((tm: any) => tm.user_id === formData.assigned_to)
      })

      if (hasSameAssignment) {
        setConflictWarning({
          message: 'The selected team member is already assigned to another job on this date.',
          suggestion: 'Please assign a different team member to avoid conflicts.'
        })
      } else {
        setConflictWarning(null)
      }
    } else {
      setConflictWarning(null)
    }
  }, [formData.date, formData.start_time, formData.end_time, formData.assigned_to, existingJobs, userProfile])

  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: newJob, error: insertError } = await supabase
        .from('jobs')
        .insert({
          user_id: user.id,
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
          status: 'Inquiry',
        })
        .select()
        .single()

      if (insertError) throw insertError

      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      router.push(`/dashboard/jobs/${newJob.id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to create job')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/jobs" className="inline-flex items-center text-body text-secondary hover:underline">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Jobs
      </Link>

      <h1 className="text-app-title text-primary">Create New Job</h1>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-body text-red-600">{error}</p>
            </div>
          )}

          {conflictWarning && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-800 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-body font-medium text-yellow-900 mb-1">{conflictWarning.message}</p>
                  <p className="text-caption text-yellow-700 italic">{conflictWarning.suggestion}</p>
                </div>
              </div>
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
                disabled={isLoading}
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
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                disabled={isLoading}
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
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-card-title text-text-dark mb-2">Package Type</label>
              <select
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary"
                value={formData.package_type}
                onChange={(e) => setFormData({ ...formData, package_type: e.target.value })}
                disabled={isLoading}
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
                disabled={isLoading}
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
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-card-title text-text-dark mb-2">Start Time</label>
              <input
                type="time"
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-card-title text-text-dark mb-2">End Time</label>
              <input
                type="time"
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                disabled={isLoading}
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
                disabled={isLoading}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-card-title text-text-dark mb-2">Notes</label>
              <textarea
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary min-h-[100px]"
                placeholder="Additional notes about this job..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
            >
              Create Job
            </Button>
            <Link href="/dashboard/jobs">
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

