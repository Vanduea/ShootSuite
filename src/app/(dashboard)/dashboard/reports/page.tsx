/**
 * Reports & Analytics Page
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { DollarSign, TrendingUp, Calendar, Users, Download } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useState } from 'react'

async function getFinancialStats() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get all jobs with invoices and payments
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*, invoices(*), payments(*), expenses(*)')
    .eq('user_id', user.id)

  if (!jobs) return null

  const totalRevenue = jobs.reduce((sum, job) => {
    const invoices = job.invoices || []
    return sum + invoices.reduce((invSum: number, inv: any) => {
      return invSum + parseFloat(inv.total_amount || '0')
    }, 0)
  }, 0)

  const totalPaid = jobs.reduce((sum, job) => {
    const payments = job.payments || []
    return sum + payments
      .filter((p: any) => p.status === 'Completed')
      .reduce((paySum: number, pay: any) => {
        return paySum + parseFloat(pay.amount || '0')
      }, 0)
  }, 0)

  const totalExpenses = jobs.reduce((sum, job) => {
    const expenses = job.expenses || []
    return sum + expenses.reduce((expSum: number, exp: any) => {
      return expSum + parseFloat(exp.amount || '0')
    }, 0)
  }, 0)

  const outstanding = totalRevenue - totalPaid
  const profit = totalPaid - totalExpenses

  // Monthly breakdown
  const monthlyData: Record<string, { revenue: number; expenses: number }> = {}
  jobs.forEach((job) => {
    const month = new Date(job.date).toISOString().slice(0, 7) // YYYY-MM
    if (!monthlyData[month]) {
      monthlyData[month] = { revenue: 0, expenses: 0 }
    }
    
    const invoices = job.invoices || []
    monthlyData[month].revenue += invoices.reduce((sum: number, inv: any) => {
      return sum + parseFloat(inv.total_amount || '0')
    }, 0)

    const expenses = job.expenses || []
    monthlyData[month].expenses += expenses.reduce((sum: number, exp: any) => {
      return sum + parseFloat(exp.amount || '0')
    }, 0)
  })

  return {
    totalRevenue,
    totalPaid,
    totalExpenses,
    outstanding,
    profit,
    monthlyData,
    jobCount: jobs.length,
  }
}

async function getRecentActivity() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*, clients(*), invoices(*), payments(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  return jobs || []
}

export default function ReportsPage() {
  const [isExporting, setIsExporting] = useState(false)

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['financial-stats'],
    queryFn: getFinancialStats,
  })

  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: getRecentActivity,
  })

  const handleExport = async (type: 'jobs' | 'clients' | 'invoices') => {
    setIsExporting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(`/api/export/${type}?format=csv`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error: any) {
      alert(error.message || 'Failed to export')
    } finally {
      setIsExporting(false)
    }
  }

  if (statsLoading || activityLoading) {
    return (
      <Card>
        <p className="text-body text-text-muted">Loading reports...</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-app-title text-primary">Reports & Analytics</h1>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => handleExport('jobs')}
            isLoading={isExporting}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Jobs
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleExport('clients')}
            isLoading={isExporting}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Clients
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleExport('invoices')}
            isLoading={isExporting}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Invoices
          </Button>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption text-text-muted">Total Revenue</p>
              <p className="text-2xl font-bold text-primary mt-1">
                {formatCurrency(stats?.totalRevenue || 0)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-secondary" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption text-text-muted">Total Paid</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(stats?.totalPaid || 0)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption text-text-muted">Outstanding</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {formatCurrency(stats?.outstanding || 0)}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-orange-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption text-text-muted">Net Profit</p>
              <p className="text-2xl font-bold text-primary mt-1">
                {formatCurrency(stats?.profit || 0)}
              </p>
            </div>
            <Users className="w-8 h-8 text-secondary" />
          </div>
        </Card>
      </div>

      {/* Monthly Breakdown */}
      <Card>
        <h2 className="text-section-header text-primary mb-4">Monthly Breakdown</h2>
        <div className="space-y-3">
          {Object.entries(stats?.monthlyData || {})
            .sort(([a], [b]) => b.localeCompare(a))
            .slice(0, 6)
            .map(([month, data]) => (
              <div key={month} className="flex items-center justify-between p-3 border border-border-gray rounded-lg">
                <div>
                  <p className="text-body font-medium text-text-dark">
                    {new Date(month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                  </p>
                  <p className="text-caption text-text-muted">
                    Revenue: {formatCurrency(data.revenue)} • Expenses: {formatCurrency(data.expenses)}
                  </p>
                </div>
                <p className="text-body font-bold text-primary">
                  {formatCurrency(data.revenue - data.expenses)}
                </p>
              </div>
            ))}
        </div>
      </Card>

      {/* Recent Activity */}
      <Card>
        <h2 className="text-section-header text-primary mb-4">Recent Activity</h2>
        <div className="space-y-2">
          {recentActivity?.map((job: any) => (
            <div key={job.id} className="p-3 border border-border-gray rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-body font-medium text-text-dark">
                    {job.title || `${job.clients?.name || 'Client'} - ${formatDate(job.date)}`}
                  </p>
                  <p className="text-caption text-text-muted">
                    {job.clients?.name} • {formatDate(job.date)}
                  </p>
                </div>
                <div className="text-right">
                  {job.invoices?.[0] && (
                    <p className="text-body font-medium text-primary">
                      {formatCurrency(parseFloat(job.invoices[0].total_amount || '0'))}
                    </p>
                  )}
                  <p className="text-caption text-text-muted">{job.status}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
