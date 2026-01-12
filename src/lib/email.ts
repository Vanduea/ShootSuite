/**
 * Email Service
 * Handles sending emails for various events
 * Uses Supabase Auth email or can be extended to use other services
 */

import { createServerClient } from './supabase'

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * Send email using Supabase Auth email
 * Note: Supabase Auth email is limited. For production, consider:
 * - Resend (recommended)
 * - SendGrid
 * - AWS SES
 * - Supabase Edge Function with email service
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // For now, we'll use Supabase's built-in email
    // In production, you'd call an email service API
    
    // Option 1: Use Supabase Edge Function for email
    // Option 2: Use a service like Resend directly
    // Option 3: Use Supabase Auth's email (limited)
    
    // This is a placeholder - implement based on your email service
    console.log('Email would be sent:', {
      to: options.to,
      subject: options.subject,
    })
    
    // TODO: Implement actual email sending
    // Example with Resend:
    // const resend = new Resend(process.env.RESEND_API_KEY)
    // await resend.emails.send({
    //   from: 'ShootSuite <noreply@shootsuite.com>',
    //   to: options.to,
    //   subject: options.subject,
    //   html: options.html,
    // })
    
    return true
  } catch (error) {
    console.error('Email sending error:', error)
    return false
  }
}

/**
 * Send approval notification email
 */
export async function sendApprovalEmail(userEmail: string, userName: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #261A54; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #345EBE; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Shoot<span style="color: #345EBE;">Suite</span></h1>
          </div>
          <div class="content">
            <h2>Account Approved!</h2>
            <p>Hi ${userName},</p>
            <p>Great news! Your ShootSuite account has been approved by our admin team.</p>
            <p>You can now log in and complete your profile setup to start managing your photography business.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login" class="button">Log In Now</a>
            <p>If you have any questions, please don't hesitate to contact us.</p>
            <p>Best regards,<br>The ShootSuite Team</p>
          </div>
        </div>
      </body>
    </html>
  `
  
  return sendEmail({
    to: userEmail,
    subject: 'Your ShootSuite Account Has Been Approved',
    html,
  })
}

/**
 * Send rejection notification email
 */
export async function sendRejectionEmail(userEmail: string, userName: string, reason: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #261A54; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .reason-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Shoot<span style="color: #345EBE;">Suite</span></h1>
          </div>
          <div class="content">
            <h2>Account Registration Update</h2>
            <p>Hi ${userName},</p>
            <p>We regret to inform you that your ShootSuite account registration has not been approved at this time.</p>
            <div class="reason-box">
              <strong>Reason:</strong>
              <p>${reason}</p>
            </div>
            <p>If you believe this is an error or would like to appeal this decision, please contact our support team.</p>
            <p>Best regards,<br>The ShootSuite Team</p>
          </div>
        </div>
      </body>
    </html>
  `
  
  return sendEmail({
    to: userEmail,
    subject: 'ShootSuite Account Registration Update',
    html,
  })
}

/**
 * Send invoice notification email
 */
export async function sendInvoiceEmail(clientEmail: string, clientName: string, invoiceNumber: string, amount: number, portalUrl: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #261A54; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .invoice-box { background: white; border: 2px solid #261A54; padding: 20px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background: #345EBE; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Shoot<span style="color: #345EBE;">Suite</span></h1>
          </div>
          <div class="content">
            <h2>New Invoice</h2>
            <p>Hi ${clientName},</p>
            <p>A new invoice has been generated for your photography session.</p>
            <div class="invoice-box">
              <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
              <p><strong>Amount Due:</strong> $${amount.toFixed(2)}</p>
            </div>
            <a href="${portalUrl}" class="button">View Invoice & Pay</a>
            <p>You can view your invoice and make a payment through your client portal.</p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
            <p>Best regards,<br>Your Photographer</p>
          </div>
        </div>
      </body>
    </html>
  `
  
  return sendEmail({
    to: clientEmail,
    subject: `Invoice ${invoiceNumber} - Payment Due`,
    html,
  })
}

/**
 * Send payment received notification email
 */
export async function sendPaymentReceivedEmail(clientEmail: string, clientName: string, amount: number, invoiceNumber: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #261A54; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .success-box { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Shoot<span style="color: #345EBE;">Suite</span></h1>
          </div>
          <div class="content">
            <h2>Payment Received</h2>
            <p>Hi ${clientName},</p>
            <p>Thank you for your payment!</p>
            <div class="success-box">
              <p><strong>Payment Amount:</strong> $${amount.toFixed(2)}</p>
              <p><strong>Invoice:</strong> ${invoiceNumber}</p>
            </div>
            <p>Your payment has been successfully processed. Your deliverables will be unlocked shortly.</p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
            <p>Best regards,<br>Your Photographer</p>
          </div>
        </div>
      </body>
    </html>
  `
  
  return sendEmail({
    to: clientEmail,
    subject: `Payment Received - Invoice ${invoiceNumber}`,
    html,
  })
}

/**
 * Send deliverable ready notification email
 */
export async function sendDeliverableReadyEmail(clientEmail: string, clientName: string, portalUrl: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #261A54; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #345EBE; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Shoot<span style="color: #345EBE;">Suite</span></h1>
          </div>
          <div class="content">
            <h2>Your Photos Are Ready!</h2>
            <p>Hi ${clientName},</p>
            <p>Great news! Your photos are ready for download.</p>
            <p>You can access your gallery through your client portal.</p>
            <a href="${portalUrl}" class="button">View Your Photos</a>
            <p>If you have any questions, please don't hesitate to contact us.</p>
            <p>Best regards,<br>Your Photographer</p>
          </div>
        </div>
      </body>
    </html>
  `
  
  return sendEmail({
    to: clientEmail,
    subject: 'Your Photos Are Ready for Download',
    html,
  })
}

