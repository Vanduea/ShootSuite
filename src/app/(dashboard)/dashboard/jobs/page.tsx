/**
 * Jobs List Page
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Plus, Calendar, MapPin, DollarSign } from 'lucide-react'
import { formatDate, getStatusColor } from '@/lib/utils'

async function getJobs() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('jobs')
    .select('*, clients(*)')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  if (error) throw error
  return data || []
}

export default function JobsPage() {
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: getJobs,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-app-title text-primary">Jobs</h1>
        <Link href="/dashboard/jobs/new">
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            New Job
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <Card>
          <p className="text-body text-text-muted">Loading jobs...</p>
        </Card>
      ) : jobs.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-body text-text-muted mb-4">
              No shoots yet — your next masterpiece starts here.
            </p>
            <Link href="/dashboard/jobs/new">
              <Button variant="primary">Create Your First Job</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <Link key={job.id} href={`/dashboard/jobs/${job.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-card-title text-primary">
                    {job.title || `${job.clients?.name || 'Untitled'} - ${formatDate(job.date)}`}
                  </h3>
                  <span className={`px-2 py-1 rounded text-caption font-medium ${getStatusColor(job.status)}`}>
                    {job.status}
                  </span>
                </div>

                <div className="space-y-2 text-caption text-text-muted">
                  {job.date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(job.date)}</span>
                    </div>
                  )}
                  
                  {job.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{job.location}</span>
                    </div>
                  )}
                  
                  {job.price && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-3 h-3" />
                      <span>${job.price.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

