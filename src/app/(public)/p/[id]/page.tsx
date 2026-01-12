/**
 * Client Portal Page
 * Public-facing portal for clients to view their job and deliverables
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Lock, Unlock, ExternalLink, Calendar, MapPin, DollarSign, Download } from 'lucide-react'
import Image from 'next/image'
import { formatDate, formatCurrency } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

async function getJobByPortalId(portalId: string) {
  // In a real implementation, you'd have a separate portal_access table
  // For now, we'll use the job ID directly (in production, use a secure UUID)
  const { data, error } = await supabase
    .from('jobs')
    .select('*, clients(*), deliverables(*), invoices(*)')
    .eq('id', portalId)
    .single()

  if (error) throw error
  return data
}

function PayInvoiceButton({ invoiceId, jobId, amount, portalId }: { invoiceId: string; jobId: string; amount: string; portalId: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePay = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: invoiceId,
          job_id: jobId,
          amount: parseFloat(amount),
          portal_id: portalId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start payment')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      {error && (
        <p className="text-caption text-red-600 mb-2">{error}</p>
      )}
      <Button
        variant="primary"
        className="w-full mt-4"
        onClick={handlePay}
        isLoading={isLoading}
      >
        Pay ${parseFloat(amount).toFixed(2)}
      </Button>
    </div>
  )
}

export default function ClientPortalPage({ params }: { params: { id: string } }) {
  const portalId = params.id
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)

  useEffect(() => {
    const status = searchParams?.get('payment')
    if (status) {
      setPaymentStatus(status)
      // Refresh job data after payment
      if (status === 'success') {
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      }
    }
  }, [searchParams])

  const { data: job, isLoading, error } = useQuery({
    queryKey: ['portal-job', portalId],
    queryFn: () => getJobByPortalId(portalId),
    enabled: !!portalId,
    retry: false,
  })

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!job) return

    const deliverable = job.deliverables?.[0]
    if (deliverable?.password && deliverable.password === password) {
      setIsUnlocked(true)
      setPasswordError('')
    } else {
      setPasswordError('Incorrect password')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center">
        <Card>
          <p className="text-body text-text-muted">Loading...</p>
        </Card>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center p-4">
        <Card>
          <h1 className="text-section-header text-primary mb-4">Job Not Found</h1>
          <p className="text-body text-text-muted">
            The job you're looking for doesn't exist or the link is invalid.
          </p>
        </Card>
      </div>
    )
  }

  const deliverable = job.deliverables?.[0]
  const invoice = job.invoices?.[0]
  const isPaid = invoice ? parseFloat(invoice.balance || '0') === 0 : false
  const needsPassword = deliverable?.password && !isUnlocked
  const canAccess = (isPaid || !deliverable?.is_locked) && !needsPassword

  return (
    <div className="min-h-screen bg-bg-light">
      {/* Header */}
      <header className="bg-primary text-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <Image
              src="/icon300.png"
              alt="ShootSuite Logo"
              width={32}
              height={32}
              className="rounded"
            />
            <h1 className="text-app-title">
              Shoot<span style={{ color: '#345ebe' }}>Suite</span>
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {paymentStatus === 'success' && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-body text-green-800 font-medium">
              Payment successful! Your deliverables are being unlocked...
            </p>
          </div>
        )}
        {paymentStatus === 'cancelled' && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-body text-yellow-800">
              Payment was cancelled. You can try again when ready.
            </p>
          </div>
        )}
        <div className="space-y-6">
          {/* Job Info */}
          <Card>
            <h2 className="text-section-header text-primary mb-4">Your Photo Session</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-secondary mt-0.5" />
                <div>
                  <p className="text-caption text-text-muted">Date</p>
                  <p className="text-body text-text-dark">{formatDate(job.date)}</p>
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

              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-secondary mt-0.5" />
                <div>
                  <p className="text-caption text-text-muted">Status</p>
                  <p className="text-body text-text-dark">{job.status}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Invoice/Payment */}
          {invoice && (
            <Card>
              <h2 className="text-section-header text-primary mb-4">Invoice</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-body text-text-muted">Invoice Number</span>
                  <span className="text-body text-text-dark font-medium">{invoice.invoice_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-body text-text-muted">Total Amount</span>
                  <span className="text-body text-text-dark font-medium">
                    {formatCurrency(parseFloat(invoice.total_amount || '0'))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-body text-text-muted">Balance</span>
                  <span className={`text-body font-medium ${
                    parseFloat(invoice.balance || '0') === 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(parseFloat(invoice.balance || '0'))}
                  </span>
                </div>
                {parseFloat(invoice.balance || '0') > 0 && (
                  <PayInvoiceButton
                    invoiceId={invoice.id}
                    jobId={job.id}
                    amount={invoice.balance}
                    portalId={portalId}
                  />
                )}
              </div>
            </Card>
          )}

          {/* Deliverables */}
          {deliverable ? (
            <Card>
              <h2 className="text-section-header text-primary mb-4">Your Photos</h2>
              
              {!canAccess && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="w-5 h-5 text-yellow-800" />
                    <p className="text-body text-yellow-800 font-medium">Delivery Locked</p>
                  </div>
                  {!isPaid && (
                    <p className="text-body text-yellow-700">
                      Complete payment to unlock your gallery.
                    </p>
                  )}
                  {needsPassword && (
                    <form onSubmit={handlePasswordSubmit} className="mt-3">
                      <div className="flex gap-2">
                        <input
                          type="password"
                          className="flex-1 px-3 py-2 border border-yellow-300 rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary"
                          placeholder="Enter password"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value)
                            setPasswordError('')
                          }}
                        />
                        <Button type="submit" variant="primary">
                          Unlock
                        </Button>
                      </div>
                      {passwordError && (
                        <p className="text-caption text-red-600 mt-1">{passwordError}</p>
                      )}
                    </form>
                  )}
                </div>
              )}

              {canAccess && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <Unlock className="w-5 h-5" />
                    <p className="text-body font-medium">Delivery Unlocked</p>
                  </div>

                  <a
                    href={deliverable.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button variant="primary" className="w-full">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Access Your Photos
                    </Button>
                  </a>

                  {deliverable.expires_at && (
                    <p className="text-caption text-text-muted text-center">
                      Link expires: {formatDate(deliverable.expires_at)}
                    </p>
                  )}
                </div>
              )}
            </Card>
          ) : (
            <Card>
              <h2 className="text-section-header text-primary mb-4">Your Photos</h2>
              <p className="text-body text-text-muted">
                Your photos are being prepared. We'll notify you when they're ready!
              </p>
            </Card>
          )}

          {/* Footer */}
          <div className="text-center py-6">
            <p className="text-caption text-text-muted">
              Powered by Shoot<span style={{ color: '#345ebe' }}>Suite</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

