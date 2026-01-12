# Email Notifications Setup Guide

## Overview

ShootSuite includes email notification functionality for key events. The email service is currently set up with placeholder functions that need to be connected to an actual email service provider.

## Email Events

The following email notifications are implemented:

1. **User Approval** - Sent when Super Admin approves a user registration
2. **User Rejection** - Sent when Super Admin rejects a user registration
3. **Invoice Created** - Sent when an invoice is created
4. **Payment Received** - Sent when a payment is successfully processed
5. **Deliverable Ready** - Sent when deliverables are unlocked/ready

## Implementation Status

✅ **Email Templates**: All email templates are created with HTML formatting
✅ **Email Service Functions**: Functions created in `src/lib/email.ts`
✅ **API Route**: Email sending API route at `/api/email/send`
✅ **Integration**: Integrated into:
   - Admin user approval/rejection
   - Invoice creation
   - Payment processing (Stripe webhook)
   - Deliverable unlocking

## Setup Options

### Option 1: Resend (Recommended)

Resend is a modern email API service with excellent developer experience.

1. **Sign up** at [resend.com](https://resend.com)
2. **Get API key** from dashboard
3. **Install Resend**:
   ```bash
   npm install resend
   ```
4. **Update `src/lib/email.ts`**:
   ```typescript
   import { Resend } from 'resend'
   
   const resend = new Resend(process.env.RESEND_API_KEY)
   
   export async function sendEmail(options: EmailOptions): Promise<boolean> {
     try {
       await resend.emails.send({
         from: 'ShootSuite <noreply@yourdomain.com>',
         to: options.to,
         subject: options.subject,
         html: options.html,
         text: options.text,
       })
       return true
     } catch (error) {
       console.error('Email sending error:', error)
       return false
     }
   }
   ```
5. **Add to `.env.local`**:
   ```env
   RESEND_API_KEY=re_...
   ```

### Option 2: SendGrid

1. **Sign up** at [sendgrid.com](https://sendgrid.com)
2. **Create API key** in dashboard
3. **Install SendGrid**:
   ```bash
   npm install @sendgrid/mail
   ```
4. **Update `src/lib/email.ts`**:
   ```typescript
   import sgMail from '@sendgrid/mail'
   
   sgMail.setApiKey(process.env.SENDGRID_API_KEY!)
   
   export async function sendEmail(options: EmailOptions): Promise<boolean> {
     try {
       await sgMail.send({
         from: 'noreply@yourdomain.com',
         to: options.to,
         subject: options.subject,
         html: options.html,
         text: options.text,
       })
       return true
     } catch (error) {
       console.error('Email sending error:', error)
       return false
     }
   }
   ```
5. **Add to `.env.local`**:
   ```env
   SENDGRID_API_KEY=SG....
   ```

### Option 3: Supabase Email (Limited)

Supabase Auth has built-in email functionality, but it's limited to authentication emails. For transactional emails, use a dedicated service.

### Option 4: AWS SES

1. **Set up AWS SES** in your AWS account
2. **Verify domain** or email address
3. **Create IAM user** with SES permissions
4. **Install AWS SDK**:
   ```bash
   npm install @aws-sdk/client-ses
   ```
5. **Update `src/lib/email.ts`** to use AWS SES SDK

## Environment Variables

Add to `.env.local`:

```env
# Email Service (choose one)
RESEND_API_KEY=re_...
# OR
SENDGRID_API_KEY=SG....
# OR
AWS_SES_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# App URL (for email links)
NEXT_PUBLIC_APP_URL=https://your-app.com
```

## Email Templates

All email templates are HTML-formatted and include:
- Branded header with ShootSuite logo
- Clear messaging
- Call-to-action buttons
- Responsive design

Templates are located in `src/lib/email.ts`:
- `sendApprovalEmail()` - User approval notification
- `sendRejectionEmail()` - User rejection notification
- `sendInvoiceEmail()` - Invoice creation notification
- `sendPaymentReceivedEmail()` - Payment confirmation
- `sendDeliverableReadyEmail()` - Deliverable ready notification

## Testing

To test email functionality:

1. Set up your email service provider
2. Update `src/lib/email.ts` with the provider's SDK
3. Test each email type:
   - Approve/reject a user
   - Create an invoice
   - Process a payment
   - Unlock a deliverable

## Production Considerations

1. **Domain Verification**: Verify your sending domain with your email provider
2. **SPF/DKIM Records**: Set up DNS records for better deliverability
3. **Rate Limiting**: Be aware of email sending limits
4. **Error Handling**: Monitor failed email sends
5. **Email Queue**: Consider implementing a queue for high-volume sending

## Current Status

The email infrastructure is complete and ready. You just need to:
1. Choose an email service provider
2. Install the provider's SDK
3. Update `src/lib/email.ts` with the provider's implementation
4. Add API key to environment variables

---

*Last Updated: January 2024*

