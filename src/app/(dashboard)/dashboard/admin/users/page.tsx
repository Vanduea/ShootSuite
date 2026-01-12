/**
 * Admin Users Management Page
 * Super Admin can approve/reject user registrations
 */

'use client'

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { formatDateTime } from '@/lib/utils'
import { Check, X, Eye } from 'lucide-react'
// Toast notifications - using simple alerts for now
// TODO: Integrate with existing toast system
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { sendApprovalEmail, sendRejectionEmail } from '@/lib/email'

async function getPendingUsers() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Verify user is super admin
  const { data: adminCheck } = await supabase
    .from('users')
    .select('role, status')
    .eq('id', user.id)
    .single()

  if (!adminCheck || adminCheck.role !== 'super_admin' || adminCheck.status !== 'active') {
    throw new Error('Unauthorized: Super Admin access required')
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

async function getAllUsers() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: adminCheck } = await supabase
    .from('users')
    .select('role, status')
    .eq('id', user.id)
    .single()

  if (!adminCheck || adminCheck.role !== 'super_admin' || adminCheck.status !== 'active') {
    throw new Error('Unauthorized: Super Admin access required')
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export default function AdminUsersPage() {
  const router = useRouter()
  // Toast helper function
  const showToast = (title: string, description?: string, type: 'success' | 'error' = 'success') => {
    if (type === 'success') {
      alert(`${title}\n${description || ''}`)
    } else {
      alert(`Error: ${title}\n${description || ''}`)
    }
  }
  const queryClient = useQueryClient()
  const [viewMode, setViewMode] = useState<'pending' | 'all'>('pending')

  // Check if user is super admin
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('users')
        .select('role, status')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'super_admin' || profile.status !== 'active') {
        router.push('/dashboard')
        showToast('Access Denied', 'Super Admin access required.', 'error')
      }
    }

    checkAdmin()
  }, [router])

  const { data: pendingUsers = [], isLoading: isLoadingPending } = useQuery({
    queryKey: ['admin', 'pending-users'],
    queryFn: getPendingUsers,
    enabled: viewMode === 'pending',
  })

  const { data: allUsers = [], isLoading: isLoadingAll } = useQuery({
    queryKey: ['admin', 'all-users'],
    queryFn: getAllUsers,
    enabled: viewMode === 'all',
  })

  const approveMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason?: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get user data before updating
      const { data: userData } = await supabase
        .from('users')
        .select('email, name, company_name')
        .eq('id', userId)
        .single()

      const { error } = await supabase
        .from('users')
        .update({
          status: 'active',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          rejection_reason: null,
        })
        .eq('id', userId)

      if (error) throw error

      // Send approval email via API
      if (userData?.email) {
        try {
          await fetch('/api/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'approval',
              email: userData.email,
              name: userData.name || userData.company_name || 'User',
            }),
          })
        } catch (emailError) {
          console.error('Failed to send approval email:', emailError)
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] })
      showToast('User Approved', 'The user account has been activated.')
    },
    onError: (error: any) => {
      showToast('Error', error.message || 'Failed to approve user', 'error')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get user data before updating
      const { data: userData } = await supabase
        .from('users')
        .select('email, name, company_name')
        .eq('id', userId)
        .single()

      const { error } = await supabase
        .from('users')
        .update({
          status: 'rejected',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq('id', userId)

      if (error) throw error

      // Send rejection email via API
      if (userData?.email) {
        try {
          await fetch('/api/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'rejection',
              email: userData.email,
              name: userData.name || userData.company_name || 'User',
              reason,
            }),
          })
        } catch (emailError) {
          console.error('Failed to send rejection email:', emailError)
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] })
      showToast('User Rejected', 'The user registration has been rejected.')
    },
    onError: (error: any) => {
      showToast('Error', error.message || 'Failed to reject user', 'error')
    },
  })

  const handleApprove = (userId: string) => {
    if (confirm('Approve this user registration?')) {
      approveMutation.mutate({ userId })
    }
  }

  const handleReject = (userId: string) => {
    const reason = prompt('Please provide a reason for rejection:')
    if (reason && reason.trim()) {
      rejectMutation.mutate({ userId, reason: reason.trim() })
    }
  }

  const users = viewMode === 'pending' ? pendingUsers : allUsers
  const isLoading = viewMode === 'pending' ? isLoadingPending : isLoadingAll

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-app-title text-primary">User Management</h1>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'pending' ? 'primary' : 'tertiary'}
            size="sm"
            onClick={() => setViewMode('pending')}
          >
            Pending ({pendingUsers.length})
          </Button>
          <Button
            variant={viewMode === 'all' ? 'primary' : 'tertiary'}
            size="sm"
            onClick={() => setViewMode('all')}
          >
            All Users
          </Button>
        </div>
      </div>

      {users.length === 0 ? (
        <Card>
          <p className="text-body text-muted-text text-center py-8">
            {viewMode === 'pending' ? 'No pending user registrations.' : 'No users found.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {users.map((user: any) => (
            <Card key={user.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-card-title text-dark-text">
                      {user.name || user.company_name || user.email}
                    </h3>
                    <span className={`px-2 py-1 rounded text-caption font-medium ${
                      user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      user.status === 'active' ? 'bg-green-100 text-green-800' :
                      user.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.status}
                    </span>
                    {user.user_type && (
                      <span className="px-2 py-1 rounded text-caption bg-blue-100 text-blue-800">
                        {user.user_type}
                      </span>
                    )}
                  </div>
                  <p className="text-body text-muted-text mb-1">{user.email}</p>
                  {user.company_name && (
                    <p className="text-body text-muted-text mb-1">Company: {user.company_name}</p>
                  )}
                  {user.date_of_birth && (
                    <p className="text-body text-muted-text mb-1">
                      DOB: {new Date(user.date_of_birth).toLocaleDateString()}
                    </p>
                  )}
                  <p className="text-caption text-muted-text">
                    Registered: {formatDateTime(user.created_at)}
                  </p>
                  {user.rejection_reason && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                      <p className="text-caption text-red-800 font-medium">Rejection Reason:</p>
                      <p className="text-body text-red-700">{user.rejection_reason}</p>
                    </div>
                  )}
                </div>

                {user.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleApprove(user.id)}
                      isLoading={approveMutation.isPending}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="tertiary"
                      size="sm"
                      onClick={() => handleReject(user.id)}
                      isLoading={rejectMutation.isPending}
                      className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

