/**
 * Account Rejected Page
 * Shown when user's account has been rejected by Super Admin
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import Image from 'next/image'

export default function RejectedPage() {
  const router = useRouter()
  const [rejectionReason, setRejectionReason] = useState<string | null>(null)

  useEffect(() => {
    const fetchRejectionReason = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        const { data: user } = await supabase
          .from('users')
          .select('rejection_reason, status')
          .eq('id', session.user.id)
          .single()

        if (user) {
          setRejectionReason(user.rejection_reason)
          
          // If status changed to active, redirect
          if (user.status === 'active') {
            router.push('/setup-profile')
          }
        }
      } else {
        router.push('/login')
      }
    }

    fetchRejectionReason()
  }, [router])

  return (
    <div className="min-h-screen bg-bg-light flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Image
              src="/icon300.png"
              alt="ShootSuite Logo"
              width={64}
              height={64}
              className="rounded-full"
            />
          </div>
          <h1 className="text-app-title text-primary mb-2">
            Shoot<span style={{ color: '#345ebe' }}>Suite</span>
          </h1>
        </div>

        <Card>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>

            <h2 className="text-section-header text-primary mb-2">
              Account Not Approved
            </h2>

            <p className="text-body text-muted-text">
              Unfortunately, your account registration was not approved at this time.
            </p>

            {rejectionReason && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-left">
                <p className="text-caption text-red-800 font-medium mb-1">Reason:</p>
                <p className="text-body text-red-700">{rejectionReason}</p>
              </div>
            )}

            <p className="text-caption text-muted-text">
              If you believe this is an error, please contact support or try registering again.
            </p>

            <div className="pt-4 space-y-2">
              <Link href="/signup">
                <button className="w-full btn-primary">
                  Register Again
                </button>
              </Link>
              <Link href="/login">
                <button className="w-full btn-tertiary">
                  Back to Sign In
                </button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

