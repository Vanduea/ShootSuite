/**
 * Edit Client Page
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

async function getClient(id: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) throw error
  return data
}

export default function EditClientPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const clientId = params.id as string

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => getClient(clientId),
    enabled: !!clientId,
  })

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    notes: '',
  })
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        company: client.company || '',
        address: client.address || '',
        notes: client.notes || '',
      })
    }
  }, [client])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSaving(true)

    try {
      const { error: updateError } = await supabase
        .from('clients')
        .update({
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          company: formData.company || null,
          address: formData.address || null,
          notes: formData.notes || null,
        })
        .eq('id', clientId)

      if (updateError) throw updateError

      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['client', clientId] })
      router.push(`/dashboard/clients/${clientId}`)
    } catch (err: any) {
      setError(err.message || 'Failed to update client')
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
      <Link href={`/dashboard/clients/${clientId}`} className="inline-flex items-center text-body text-secondary hover:underline">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Client
      </Link>

      <h1 className="text-app-title text-primary">Edit Client</h1>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-body text-red-600">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-card-title text-text-dark mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="block text-card-title text-text-dark mb-2">Email</label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="block text-card-title text-text-dark mb-2">Phone</label>
              <input
                type="tel"
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="block text-card-title text-text-dark mb-2">Company</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary"
                placeholder="Company Name"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                disabled={isSaving}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-card-title text-text-dark mb-2">Address</label>
              <textarea
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary min-h-[80px]"
                placeholder="Billing address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                disabled={isSaving}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-card-title text-text-dark mb-2">Notes</label>
              <textarea
                className="w-full px-3 py-2 border border-border-gray rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-secondary min-h-[100px]"
                placeholder="Internal notes about this client..."
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
              Save Changes
            </Button>
            <Link href={`/dashboard/clients/${clientId}`}>
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

