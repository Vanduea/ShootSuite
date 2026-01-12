/**
 * Generate Client Portal Link
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { ArrowLeft, Link as LinkIcon, Copy, Check } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

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

export default function PortalPage() {
  const params = useParams()
  const jobId = params.id as string
  const [copied, setCopied] = useState(false)

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => getJob(jobId),
    enabled: !!jobId,
  })

  const portalUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/p/${jobId}`
    : ''

  const handleCopy = () => {
    if (portalUrl) {
      navigator.clipboard.writeText(portalUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
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

      <h1 className="text-app-title text-primary">Client Portal</h1>

      <Card>
        <div className="space-y-4">
          <div>
            <h2 className="text-section-header text-primary mb-2">Portal Link</h2>
            <p className="text-body text-text-muted mb-4">
              Share this link with your client to give them access to their job details, invoice, and deliverables.
            </p>
            
            <div className="flex gap-2">
              <div className="flex-1 p-3 bg-bg-light rounded-lg border border-border-gray">
                <p className="text-body text-text-dark break-all">{portalUrl}</p>
              </div>
              <Button
                variant="secondary"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-body text-blue-800">
              <strong>Note:</strong> The portal is publicly accessible via this link. 
              Make sure to only share it with the intended client.
            </p>
          </div>

          <div className="pt-4 border-t border-border-gray">
            <h3 className="text-card-title text-primary mb-2">What clients can see:</h3>
            <ul className="space-y-1 text-body text-text-muted">
              <li>• Job date and location</li>
              <li>• Job status</li>
              <li>• Invoice details and payment status</li>
              <li>• Deliverables (when unlocked)</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}

