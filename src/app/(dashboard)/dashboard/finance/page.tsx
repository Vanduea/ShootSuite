/**
 * Finance & Payments Page
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import { DollarSign, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'
import { formatCurrency, formatDate, isOverdue } from '@/lib/utils'
import Link from 'next/link'

async function getInvoices() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('invoices')
    .select('*, jobs(*, clients(*))')
    .eq('jobs.user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

async function getPayments() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: jobs } = await supabase
    .from('jobs')
    .select('id')
    .eq('user_id', user.id)

  if (!jobs || jobs.length === 0) return []

  const jobIds = jobs.map(j => j.id)

  const { data, error } = await supabase
    .from('payments')
    .select('*, jobs(*, clients(*))')
    .in('job_id', jobIds)
    .order('date', { ascending: false })
    .limit(10)

  if (error) throw error
  return data || []
}

async function getExpenses() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: jobs } = await supabase
    .from('jobs')
    .select('id')
    .eq('user_id', user.id)

  if (!jobs || jobs.length === 0) return []

  const jobIds = jobs.map(j => j.id)

  const { data, error } = await supabase
    .from('expenses')
    .select('*, jobs(*)')
    .in('job_id', jobIds)
    .order('date', { ascending: false })
    .limit(10)

  if (error) throw error
  return data || []
}

export default function FinancePage() {
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: getInvoices,
  })

  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: getPayments,
  })

  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: getExpenses,
  })

  // Calculate totals
  const totalRevenue = invoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0)
  const totalPaid = invoices.reduce((sum, inv) => sum + parseFloat(inv.paid_amount || 0), 0)
  const totalOutstanding = invoices.reduce((sum, inv) => sum + parseFloat(inv.balance || 0), 0)
  const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0)
  const overdueCount = invoices.filter(inv => inv.status === 'Overdue').length

  return (
    <div className="space-y-6">
      <h1 className="text-app-title text-primary">Finance & Payments</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption text-muted-text">Total Revenue</p>
              <p className="text-section-header text-primary mt-1">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption text-muted-text">Total Paid</p>
              <p className="text-section-header text-secondary mt-1">{formatCurrency(totalPaid)}</p>
            </div>
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-secondary" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption text-muted-text">Outstanding</p>
              <p className="text-section-header text-secondary mt-1">{formatCurrency(totalOutstanding)}</p>
            </div>
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-secondary" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption text-muted-text">Overdue</p>
              <p className="text-section-header text-red-600 mt-1">{overdueCount}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoices */}
        <Card>
          <h2 className="text-section-header text-primary mb-4">Recent Invoices</h2>
          {invoicesLoading ? (
            <p className="text-body text-muted-text">Loading...</p>
          ) : invoices.length === 0 ? (
            <p className="text-body text-muted-text">No invoices yet.</p>
          ) : (
            <div className="space-y-3">
              {invoices.slice(0, 5).map((invoice: any) => (
                <Link
                  key={invoice.id}
                  href={`/dashboard/jobs/${invoice.job_id}`}
                  className="block p-3 rounded border border-border-gray hover:bg-bg-light transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-card-title text-primary">{invoice.invoice_number}</p>
                      <p className="text-caption text-muted-text">
                        {invoice.jobs?.clients?.name || 'Unknown Client'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-body text-dark-text font-medium">
                        {formatCurrency(parseFloat(invoice.total_amount || 0))}
                      </p>
                      <span className={`text-caption px-2 py-1 rounded ${
                        invoice.status === 'Paid' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {invoice.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Payments */}
        <Card>
          <h2 className="text-section-header text-primary mb-4">Recent Payments</h2>
          {paymentsLoading ? (
            <p className="text-body text-muted-text">Loading...</p>
          ) : payments.length === 0 ? (
            <p className="text-body text-muted-text">No payments yet.</p>
          ) : (
            <div className="space-y-3">
              {payments.map((payment: any) => (
                <div
                  key={payment.id}
                  className="p-3 rounded border border-border-gray"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-card-title text-primary">
                        {formatCurrency(parseFloat(payment.amount || 0))}
                      </p>
                      <p className="text-caption text-muted-text">
                        {payment.jobs?.clients?.name || 'Unknown'} • {formatDate(payment.date)}
                      </p>
                    </div>
                    <span className={`text-caption px-2 py-1 rounded ${
                      payment.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      payment.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {payment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Expenses */}
      <Card>
        <h2 className="text-section-header text-primary mb-4">Recent Expenses</h2>
        {expensesLoading ? (
          <p className="text-body text-muted-text">Loading...</p>
        ) : expenses.length === 0 ? (
          <p className="text-body text-muted-text">No expenses yet.</p>
        ) : (
          <div className="space-y-3">
            {expenses.map((expense: any) => (
              <div
                key={expense.id}
                className="p-3 rounded border border-border-gray"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-card-title text-primary">{expense.category}</p>
                    <p className="text-caption text-muted-text">
                      {expense.jobs?.title || 'Unknown Job'} • {formatDate(expense.date)}
                    </p>
                  </div>
                  <p className="text-body text-dark-text font-medium">
                    {formatCurrency(parseFloat(expense.amount || 0))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

