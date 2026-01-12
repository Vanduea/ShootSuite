/**
 * Add Expense Page
 */

'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { ArrowLeft, Receipt } from 'lucide-react'
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

export default function AddExpensePage() {
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
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  })
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const categories = [
    'Travel',
    'Gear',
    'Assistant',
    'Location',
    'Food',
    'Other',
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSaving(true)

    try {
      const { error: insertError } = await supabase
        .from('expenses')
        .insert({
          job_id: jobId,
          category: formData.category,
          amount: parseFloat(formData.amount),
          date: formData.date,
          notes: formData.notes || null,
        })

      if (insertError) throw insertError

      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['job', jobId] })
      router.push(`/dashboard/jobs/${jobId}`)
    } catch (err: any) {
      setError(err.message || 'Failed to add expense')
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

      <h1 className="text-app-title text-primary">Add Expense</h1>

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
                Category <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                disabled={isSaving}
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-card-title text-text-dark mb-2">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                disabled={isSaving}
              />
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
              <label className="block text-card-title text-text-dark mb-2">Notes</label>
              <textarea
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary min-h-[100px]"
                placeholder="Expense notes..."
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
              <Receipt className="w-4 h-4 mr-2" />
              Add Expense
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

