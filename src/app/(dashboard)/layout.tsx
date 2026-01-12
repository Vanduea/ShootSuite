/**
 * Dashboard Layout
 * Protected route wrapper
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { LogOut, Calendar, DollarSign, Settings, Shield } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import Button from '@/components/ui/Button'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      // Check user status and role
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('status, role, profile_setup_completed')
        .eq('id', session.user.id)
        .single()

      if (error || !userProfile) {
        router.push('/login')
        return
      }

      // Check account status
      if (userProfile.status === 'pending') {
        await supabase.auth.signOut()
        router.push('/signup/pending')
        return
      }

      if (userProfile.status === 'rejected') {
        await supabase.auth.signOut()
        router.push('/signup/rejected')
        return
      }

      if (userProfile.status === 'suspended') {
        await supabase.auth.signOut()
        router.push('/login')
        return
      }

      // If active but profile not set up, redirect to setup
      if (userProfile.status === 'active' && !userProfile.profile_setup_completed) {
        router.push('/setup-profile')
        return
      }

      setUserRole(userProfile.role)
    }
    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        router.push('/login')
      } else {
        // Re-check user status on auth change
        const { data: userProfile } = await supabase
          .from('users')
          .select('status, role, profile_setup_completed')
          .eq('id', session.user.id)
          .single()

        if (userProfile) {
          setUserRole(userProfile.role)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-bg-light">
      {/* Header */}
      <header className="bg-primary text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Image
                src="/icon300.png"
                alt="ShootSuite Logo"
                width={32}
                height={32}
                className="rounded"
              />
              <Link href="/dashboard" className="text-xl font-bold">
                Shoot<span style={{ color: '#345ebe' }}>Suite</span>
              </Link>
            </div>
            
                <nav className="hidden md:flex items-center gap-6">
                  <Link href="/dashboard" className="text-body hover:opacity-80 transition-opacity">
                    Dashboard
                  </Link>
                  <Link href="/dashboard/jobs" className="text-body hover:opacity-80 transition-opacity">
                    Jobs
                  </Link>
                  <Link href="/dashboard/clients" className="text-body hover:opacity-80 transition-opacity">
                    Clients
                  </Link>
                  <Link href="/dashboard/finance" className="text-body hover:opacity-80 transition-opacity">
                    Finance
                  </Link>
                  <Link href="/dashboard/calendar" className="text-body hover:opacity-80 transition-opacity">
                    Calendar
                  </Link>
                  <Link href="/dashboard/reports" className="text-body hover:opacity-80 transition-opacity">
                    Reports
                  </Link>
                  <Link href="/dashboard/settings" className="text-body hover:opacity-80 transition-opacity">
                    Settings
                  </Link>
                  {userRole === 'super_admin' && (
                    <Link href="/dashboard/admin/users" className="text-body hover:opacity-80 transition-opacity flex items-center gap-1">
                      <Shield className="w-4 h-4" />
                      Admin
                    </Link>
                  )}
                </nav>

            <div className="flex items-center gap-4">
              <Button
                variant="tertiary"
                size="sm"
                onClick={handleSignOut}
                className="text-white border-white hover:bg-white hover:text-primary"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}

