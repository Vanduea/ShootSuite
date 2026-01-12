/**
 * Pending Approval Page
 * Shown after signup while waiting for Super Admin approval
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import Image from 'next/image'

export default function PendingApprovalPage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in and their status
    const checkStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        const { data: user } = await supabase
          .from('users')
          .select('status, profile_setup_completed')
          .eq('id', session.user.id)
          .single()

        if (user) {
          if (user.status === 'active') {
            // User is approved, redirect to profile setup or dashboard
            if (!user.profile_setup_completed) {
              router.push('/setup-profile')
            } else {
              router.push('/dashboard')
            }
          } else if (user.status === 'rejected') {
            router.push('/signup/rejected')
          }
        }
      }
    }

    checkStatus()
    
    // Poll for status updates every 5 seconds
    const interval = setInterval(checkStatus, 5000)
    
    return () => clearInterval(interval)
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
            <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-yellow-600 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>

            <h2 className="text-section-header text-primary mb-2">
              Account Pending Approval
            </h2>

            <p className="text-body text-muted-text">
              Your account has been created successfully! We're reviewing your registration and will notify you once your account is approved.
            </p>

            <p className="text-caption text-muted-text">
              This page will automatically update when your account is approved. You can also check back later by signing in.
            </p>

            <div className="pt-4">
              <Link href="/login">
                <button className="text-body text-secondary hover:underline font-medium">
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

