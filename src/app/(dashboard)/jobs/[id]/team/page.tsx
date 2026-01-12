/**
 * Team Member Assignment Page
 */

'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { ArrowLeft, Plus, Mail, User, X, UserPlus } from 'lucide-react'
import Link from 'next/link'

async function getJob(id: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('jobs')
    .select('*, team_members(*, users(*))')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) throw error
  return data
}

async function getAllUsers() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Get all users (for now, we'll get users from auth, but in production
  // you'd want to get users from your users table who are assistants)
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .neq('id', user.id)
    .limit(50)

  if (error) throw error
  return data || []
}

export default function TeamPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const jobId = params.id as string

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => getJob(jobId),
    enabled: !!jobId,
  })

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: getAllUsers,
  })

  const [formData, setFormData] = useState({
    email: '',
    role: 'Assistant',
    access_level: 'Limited',
  })
  const [isAdding, setIsAdding] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [error, setError] = useState('')

  const handleAddByEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsAdding(true)

    try {
      // First, check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', formData.email)
        .single()

      let userId: string

      if (existingUser) {
        userId = existingUser.id
      } else {
        // User doesn't exist yet - create invitation
        // In a real app, you'd send an invitation email
        // For now, we'll just show an error
        throw new Error('User not found. Please invite them to ShootSuite first.')
      }

      // Check if already assigned
      const { data: existing } = await supabase
        .from('team_members')
        .select('id')
        .eq('job_id', jobId)
        .eq('user_id', userId)
        .single()

      if (existing) {
        throw new Error('This user is already assigned to this job.')
      }

      // Add team member
      const { error: insertError } = await supabase
        .from('team_members')
        .insert({
          job_id: jobId,
          user_id: userId,
          role: formData.role,
          access_level: formData.access_level,
        })

      if (insertError) throw insertError

      queryClient.invalidateQueries({ queryKey: ['job', jobId] })
      setFormData({ email: '', role: 'Assistant', access_level: 'Limited' })
      setShowAddForm(false)
    } catch (err: any) {
      setError(err.message || 'Failed to add team member')
    } finally {
      setIsAdding(false)
    }
  }

  const handleAddExistingUser = async (userId: string) => {
    try {
      // Check if already assigned
      const { data: existing } = await supabase
        .from('team_members')
        .select('id')
        .eq('job_id', jobId)
        .eq('user_id', userId)
        .single()

      if (existing) {
        alert('This user is already assigned to this job.')
        return
      }

      const { error: insertError } = await supabase
        .from('team_members')
        .insert({
          job_id: jobId,
          user_id: userId,
          role: 'Assistant',
          access_level: 'Limited',
        })

      if (insertError) throw insertError

      queryClient.invalidateQueries({ queryKey: ['job', jobId] })
    } catch (err: any) {
      alert(err.message || 'Failed to add team member')
    }
  }

  const handleRemove = async (teamMemberId: string) => {
    if (!confirm('Remove this team member from the job?')) return

    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', teamMemberId)

      if (error) throw error

      queryClient.invalidateQueries({ queryKey: ['job', jobId] })
    } catch (err: any) {
      alert(err.message || 'Failed to remove team member')
    }
  }

  const handleUpdateRole = async (teamMemberId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ role: newRole })
        .eq('id', teamMemberId)

      if (error) throw error

      queryClient.invalidateQueries({ queryKey: ['job', jobId] })
    } catch (err: any) {
      alert(err.message || 'Failed to update role')
    }
  }

  if (isLoading) {
    return (
      <Card>
        <p className="text-body text-text-muted">Loading...</p>
      </Card>
    )
  }

  const teamMembers = job?.team_members || []
  const assignedUserIds = teamMembers.map((tm: any) => tm.user_id)
  const availableUsers = allUsers.filter(u => !assignedUserIds.includes(u.id))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href={`/dashboard/jobs/${jobId}`} className="inline-flex items-center text-body text-secondary hover:underline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Job
        </Link>
        <Button
          variant="primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Team Member
        </Button>
      </div>

      <h1 className="text-app-title text-primary">Team Members</h1>

      {/* Add Team Member Form */}
      {showAddForm && (
        <Card>
          <h2 className="text-section-header text-primary mb-4">Add Team Member</h2>
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
              <p className="text-body text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Add by Email */}
            <form onSubmit={handleAddByEmail} className="space-y-4">
              <div>
                <label className="block text-card-title text-text-dark mb-2">
                  Add by Email
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    className="flex-1 px-3 py-2 border border-border-gray rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary"
                    placeholder="assistant@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={isAdding}
                  />
                  <select
                    className="px-3 py-2 border border-border-gray rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    disabled={isAdding}
                  >
                    <option value="Assistant">Assistant</option>
                    <option value="Second Shooter">Second Shooter</option>
                    <option value="Videographer">Videographer</option>
                    <option value="Stylist">Stylist</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" variant="primary" isLoading={isAdding}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add by Email
                </Button>
                <Button
                  type="button"
                  variant="tertiary"
                  onClick={() => {
                    setShowAddForm(false)
                    setFormData({ email: '', role: 'Assistant', access_level: 'Limited' })
                    setError('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>

            {/* Or Add Existing User */}
            {availableUsers.length > 0 && (
              <div>
                <label className="block text-card-title text-text-dark mb-2">
                  Or Add Existing User
                </label>
                <div className="space-y-2">
                  {availableUsers.map(user => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 rounded border border-border-gray hover:bg-bg-light"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-body text-text-dark font-medium">{user.name || 'Unknown'}</p>
                          <p className="text-caption text-text-muted">{user.email}</p>
                        </div>
                      </div>
                      <Button
                        variant="tertiary"
                        size="sm"
                        onClick={() => handleAddExistingUser(user.id)}
                      >
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Team Members List */}
      <Card>
        <h2 className="text-section-header text-primary mb-4">
          Assigned Team ({teamMembers.length})
        </h2>
        {teamMembers.length === 0 ? (
          <p className="text-body text-text-muted">No team members assigned yet.</p>
        ) : (
          <div className="space-y-3">
            {teamMembers.map((member: any) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded border border-border-gray"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-body text-text-dark font-medium">
                      {member.users?.name || 'Unknown User'}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-caption text-text-muted">{member.users?.email}</p>
                      <select
                        className="text-caption px-2 py-1 border border-border-gray rounded bg-white"
                        value={member.role}
                        onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                      >
                        <option value="Assistant">Assistant</option>
                        <option value="Second Shooter">Second Shooter</option>
                        <option value="Videographer">Videographer</option>
                        <option value="Stylist">Stylist</option>
                        <option value="Other">Other</option>
                      </select>
                      <span className="text-caption px-2 py-1 rounded bg-gray-100 text-gray-800">
                        {member.access_level}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(member.id)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

