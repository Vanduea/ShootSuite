/**
 * Record Payment Page
 */

'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { ArrowLeft, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

async function getJob(id: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('jobs')
    .select('*, invoices(*), payments(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) throw error
  return data
}

export default function RecordPaymentPage() {
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
    invoice_id: '',
    amount: '',
    type: 'Deposit',
    date: new Date().toISOString().split('T')[0],
    method: 'Stripe',
    transaction_id: '',
    notes: '',
  })
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSaving(true)

    try {
      const { error: insertError } = await supabase
        .from('payments')
        .insert({
          invoice_id: formData.invoice_id || null,
          job_id: jobId,
          amount: parseFloat(formData.amount),
          type: formData.type,
          status: 'Completed',
          date: formData.date,
          method: formData.method,
          transaction_id: formData.transaction_id || null,
          notes: formData.notes || null,
        })

      if (insertError) throw insertError

      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['job', jobId] })
      router.push(`/dashboard/jobs/${jobId}`)
    } catch (err: any) {
      setError(err.message || 'Failed to record payment')
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

  const invoices = job?.invoices || []
  const totalPaid = job?.payments?.filter((p: any) => p.status === 'Completed').reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0) || 0
  const remainingBalance = parseFloat(job?.price || 0) - totalPaid

  return (
    <div className="space-y-6">
      <Link href={`/dashboard/jobs/${jobId}`} className="inline-flex items-center text-body text-secondary hover:underline">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Job
      </Link>

      <h1 className="text-app-title text-primary">Record Payment</h1>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-body text-red-600">{error}</p>
            </div>
          )}

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-body text-blue-800">
              <strong>Job Total:</strong> {formatCurrency(parseFloat(job?.price || 0))} | 
              <strong> Paid:</strong> {formatCurrency(totalPaid)} | 
              <strong> Remaining:</strong> {formatCurrency(remainingBalance)}
            </p>
          </div>

          <div className="space-y-4">
            {invoices.length > 0 && (
              <div>
                <label className="block text-card-title text-text-dark mb-2">
                  Invoice (Optional)
                </label>
                <select
                  className="w-full px-3 py-2 border border-border-gray rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary"
                  value={formData.invoice_id}
                  onChange={(e) => setFormData({ ...formData, invoice_id: e.target.value })}
                  disabled={isSaving}
                >
                  <option value="">No invoice</option>
                  {invoices.map((inv: any) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoice_number} - {formatCurrency(parseFloat(inv.balance || 0))} remaining
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-card-title text-text-dark mb-2">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={remainingBalance}
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                disabled={isSaving}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-card-title text-text-dark mb-2">
                  Payment Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-border-gray rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  disabled={isSaving}
                >
                  <option value="Deposit">Deposit</option>
                  <option value="Final">Final</option>
                  <option value="Refund">Refund</option>
                </select>
              </div>

              <div>
                <label className="block text-card-title text-text-dark mb-2">
                  Payment Method
                </label>
                <select
                  className="w-full px-3 py-2 border border-border-gray rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary"
                  value={formData.method}
                  onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                  disabled={isSaving}
                >
                  <option value="Stripe">Stripe</option>
                  <option value="PayPal">PayPal</option>
                  <option value="Cash">Cash</option>
                  <option value="Check">Check</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
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
              <label className="block text-card-title text-text-dark mb-2">
                Transaction ID
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary"
                placeholder="txn_123456 (from Stripe/PayPal)"
                value={formData.transaction_id}
                onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="block text-card-title text-text-dark mb-2">Notes</label>
              <textarea
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary min-h-[80px]"
                placeholder="Payment notes..."
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
              <CreditCard className="w-4 h-4 mr-2" />
              Record Payment
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

