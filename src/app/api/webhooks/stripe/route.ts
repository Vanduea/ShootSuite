/**
 * Stripe Webhook Handler
 * Handles payment events from Stripe
 */

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@/lib/supabase'
import { sendPaymentReceivedEmail } from '@/lib/email'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  const supabaseClient = createServerClient()

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentSuccess(paymentIntent, supabaseClient)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentFailure(paymentIntent, supabaseClient)
        break
      }

      case 'charge.succeeded': {
        const charge = event.data.object as Stripe.Charge
        await handleChargeSuccess(charge, supabaseClient)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

async function handlePaymentSuccess(
  paymentIntent: Stripe.PaymentIntent,
  supabaseClient: ReturnType<typeof createServerClient>
) {
  const metadata = paymentIntent.metadata
  const invoiceId = metadata.invoice_id
  const jobId = metadata.job_id

  if (!invoiceId || !jobId) {
    console.error('Missing invoice_id or job_id in payment metadata')
    return
  }

  // Get invoice
  const { data: invoice } = await supabaseClient
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .single()

  if (!invoice) {
    console.error('Invoice not found:', invoiceId)
    return
  }

  const amount = paymentIntent.amount / 100 // Convert from cents

  // Create payment record
  await supabaseClient.from('payments').insert({
    job_id: jobId,
    invoice_id: invoiceId,
    amount: amount.toString(),
    type: 'Final',
    status: 'Completed',
    date: new Date().toISOString().split('T')[0],
    method: 'Stripe',
    transaction_id: paymentIntent.id,
    notes: `Stripe Payment Intent: ${paymentIntent.id}`,
  })

  // Update invoice
  const newPaidAmount = parseFloat(invoice.paid_amount || '0') + amount
  const newBalance = parseFloat(invoice.total_amount || '0') - newPaidAmount
  const newStatus = newBalance <= 0 ? 'Paid' : 'Partially Paid'

  await supabaseClient
    .from('invoices')
    .update({
      paid_amount: newPaidAmount.toString(),
      balance: newBalance.toString(),
      status: newStatus,
    })
    .eq('id', invoiceId)

  // If fully paid, unlock deliverables
  if (newBalance <= 0) {
    await supabaseClient
      .from('deliverables')
      .update({ is_locked: false })
      .eq('job_id', jobId)
    
    // Send payment received email to client
    if (invoice.jobs?.clients?.email) {
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        await fetch(`${appUrl}/api/email/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'payment_received',
            clientEmail: invoice.jobs.clients.email,
            clientName: invoice.jobs.clients.name || 'Client',
            amount,
            invoiceNumber: invoice.invoice_number || '',
          }),
        }).catch(err => console.error('Failed to send payment email:', err))
      } catch (emailError) {
        console.error('Failed to send payment email:', emailError)
      }
    }
  }
}

async function handlePaymentFailure(
  paymentIntent: Stripe.PaymentIntent,
  supabaseClient: ReturnType<typeof createServerClient>
) {
  const metadata = paymentIntent.metadata
  const invoiceId = metadata.invoice_id
  const jobId = metadata.job_id

  if (!invoiceId || !jobId) return

  // Create failed payment record
  await supabaseClient.from('payments').insert({
    job_id: jobId,
    invoice_id: invoiceId,
    amount: (paymentIntent.amount / 100).toString(),
    type: 'Final',
    status: 'Failed',
    date: new Date().toISOString().split('T')[0],
    method: 'Stripe',
    transaction_id: paymentIntent.id,
    notes: `Payment failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`,
  })
}

async function handleChargeSuccess(
  charge: Stripe.Charge,
  supabaseClient: ReturnType<typeof createServerClient>
) {
  // Additional handling if needed
  console.log('Charge succeeded:', charge.id)
}

