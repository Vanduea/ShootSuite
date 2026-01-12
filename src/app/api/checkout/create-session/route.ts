/**
 * API Route: Create Stripe Checkout Session
 * For client portal payments
 */

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

export async function POST(request: NextRequest) {
  try {
    const { invoice_id, job_id, amount, portal_id } = await request.json()

    if (!invoice_id || !job_id || !amount || !portal_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabaseClient = createServerClient()

    // Verify invoice exists
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from('invoices')
      .select('*, jobs(*, clients(*))')
      .eq('id', invoice_id)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Invoice ${invoice.invoice_number}`,
              description: `Payment for ${invoice.jobs?.clients?.name || 'Client'}`,
            },
            unit_amount: Math.round(parseFloat(amount) * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${appUrl}/p/${portal_id}?payment=success`,
      cancel_url: `${appUrl}/p/${portal_id}?payment=cancelled`,
      metadata: {
        invoice_id,
        job_id,
        portal_id,
      },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error: any) {
    console.error('Checkout session creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

