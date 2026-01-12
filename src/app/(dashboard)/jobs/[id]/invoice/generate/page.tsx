/**
 * Generate Invoice PDF Page
 */

'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { ArrowLeft, FileText, Download } from 'lucide-react'
import Link from 'next/link'

async function getInvoice(invoiceId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('invoices')
    .select('*, jobs(*, clients(*))')
    .eq('id', invoiceId)
    .eq('jobs.user_id', user.id)
    .single()

  if (error) throw error
  return data
}

export default function GenerateInvoicePDFPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const jobId = params.id as string
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const invoiceId = searchParams?.get('id') || ''

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => getInvoice(invoiceId),
    enabled: !!invoiceId,
  })

  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  const handleGeneratePDF = async () => {
    setIsGenerating(true)
    setError('')

    try {
      // Call the API route to generate PDF
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to generate PDF' }))
        throw new Error(errorData.error || 'Failed to generate PDF')
      }

      // Get PDF blob
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setPdfUrl(url)
      
      // Trigger download
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${invoice?.invoice_number || invoiceId}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      // Refresh invoice data to get updated PDF URL
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] })
    } catch (err: any) {
      setError(err.message || 'Failed to generate PDF')
    } finally {
      setIsGenerating(false)
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

      <h1 className="text-app-title text-primary">Generate Invoice PDF</h1>

      <Card>
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-body text-red-600">{error}</p>
            </div>
          )}

          <div>
            <h2 className="text-section-header text-primary mb-2">Invoice Details</h2>
            <div className="space-y-2 text-body">
              <p><strong>Invoice Number:</strong> {invoice?.invoice_number}</p>
              <p><strong>Client:</strong> {invoice?.jobs?.clients?.name}</p>
              <p><strong>Amount:</strong> ${parseFloat(invoice?.total_amount || '0').toFixed(2)}</p>
              <p><strong>Balance:</strong> ${parseFloat(invoice?.balance || '0').toFixed(2)}</p>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-body text-blue-800">
              <strong>Note:</strong> The PDF generation uses an Edge Function. 
              For production, you'll need to configure the Edge Function with a proper PDF library.
            </p>
          </div>

          <div className="flex gap-4">
            <Button
              variant="primary"
              onClick={handleGeneratePDF}
              isLoading={isGenerating}
            >
              <FileText className="w-4 h-4 mr-2" />
              Generate PDF
            </Button>
            {pdfUrl && (
              <a href={pdfUrl} download={`invoice-${invoice?.invoice_number || invoiceId}.html`}>
                <Button variant="secondary">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </a>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

