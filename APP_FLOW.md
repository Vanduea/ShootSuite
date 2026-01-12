# ShootSuite Application Flow

## Overview

ShootSuite is a multitenant photography job management application with Super Admin approval workflow. This document describes the complete application flow from signup to daily operations.

---

## Table of Contents

1. [Authentication Flow](#authentication-flow)
2. [User Onboarding Flow](#user-onboarding-flow)
3. [Super Admin Flow](#super-admin-flow)
4. [Regular User Flow](#regular-user-flow)
5. [Job Management Flow](#job-management-flow)
6. [Client Management Flow](#client-management-flow)
7. [Finance Flow](#finance-flow)
8. [Client Portal Flow](#client-portal-flow)

---

## Authentication Flow

### Signup Process

1. **User visits `/signup`**
   - Fills out signup form with:
     - Email
     - Password
     - Confirm Password
     - Account Type (Freelancer/Company)
     - Name
     - Date of Birth (if Freelancer)
     - Company Name (if Company)

2. **Form Submission**
   - Creates auth user in `auth.users` via Supabase Auth
   - Database trigger `handle_new_user` automatically creates profile in `public.users` with:
     - `role = 'user'`
     - `status = 'pending'`
     - `profile_setup_completed = false`

3. **Post-Signup Redirect**
   - User redirected to `/signup/pending`
   - Shows message: "Your account is pending approval"

### Login Process

1. **User visits `/login`**
   - Enters email and password
   - Submits form

2. **Authentication Check**
   - Supabase Auth validates credentials
   - System queries `public.users` for user profile

3. **Status-Based Redirects**
   - **`status = 'pending'`** → Redirect to `/signup/pending`
   - **`status = 'rejected'`** → Redirect to `/signup/rejected` (shows rejection reason)
   - **`status = 'suspended'`** → Show error message, prevent login
   - **`status = 'active'`** → Continue to profile check

4. **Profile Setup Check** (if `status = 'active'`)
   - **`profile_setup_completed = false`** → Redirect to `/setup-profile`
   - **`profile_setup_completed = true`** → Redirect to `/dashboard`

---

## User Onboarding Flow

### Step 1: Signup
- User creates account → Status: `pending`

### Step 2: Super Admin Approval
- Super Admin reviews user at `/dashboard/admin/users`
- Options:
  - **Approve** → Sets `status = 'active'`, `approved_by`, `approved_at`
  - **Reject** → Sets `status = 'rejected'`, `rejection_reason`

### Step 3: Profile Setup (After Approval)
- User logs in → Redirected to `/setup-profile`
- User completes profile:
  - User Type (Freelancer/Company)
  - Name
  - Company Name (if Company)
  - Date of Birth (if Freelancer)
  - Phone
  - Bio
- On submit: Sets `profile_setup_completed = true`

### Step 4: Dashboard Access
- User redirected to `/dashboard`
- Full access to application features

---

## Super Admin Flow

### Access Control
- Only users with `role = 'super_admin'` and `status = 'active'` can access admin features
- Admin link appears in navigation only for super admins

### Admin Panel (`/dashboard/admin/users`)

1. **View Modes**
   - **Pending View**: Shows users with `status = 'pending'`
   - **All Users View**: Shows all users in the system

2. **User Actions**
   - **Approve User**
     - Sets `status = 'active'`
     - Records `approved_by` and `approved_at`
     - Clears `rejection_reason`
   - **Reject User**
     - Sets `status = 'rejected'`
     - Records `rejection_reason`
     - Records `approved_by` and `approved_at`

3. **User Information Displayed**
   - Name/Company Name
   - Email
   - User Type (Freelancer/Company)
   - Date of Birth (if Freelancer)
   - Registration Date
   - Status Badge
   - Rejection Reason (if rejected)

---

## Regular User Flow

### Dashboard (`/dashboard`)
- Overview of jobs, clients, and finances
- Quick access to recent activities
- Navigation to all major sections

### Job Management Flow

#### Create Job (`/dashboard/jobs/new`)
1. **Job Form**
   - Select or create client
   - Enter job details:
     - Title
     - Date
     - Location
     - Price
     - Status (Inquiry, Booked, Completed, Cancelled)
     - Notes

2. **Job Creation**
   - Job saved to `jobs` table
   - Linked to user via `user_id`
   - Linked to client via `client_id`

#### View Job (`/dashboard/jobs/[id]`)
- Job details
- Client information
- Quick actions:
  - Edit Job
  - Create Invoice
  - Record Payment
  - Add Task
  - Manage Deliverables
  - Assign Team
  - Generate Portal Link

#### Edit Job (`/dashboard/jobs/[id]/edit`)
- Modify job details
- Update status
- Save changes

#### Job Tasks (`/dashboard/jobs/[id]/tasks`)
- View all tasks for job
- Create new tasks
- Update task status
- Delete tasks

#### Job Deliverables (`/dashboard/jobs/[id]/deliverables`)
- Upload deliverables
- Set password protection
- Lock/unlock deliverables
- Manage delivery status

#### Job Team (`/dashboard/jobs/[id]/team`)
- Assign team members
- View assigned team
- Remove team members

#### Job Invoice (`/dashboard/jobs/[id]/invoice`)
- View invoice details
- Generate PDF invoice
- Track payments

#### Record Payment (`/dashboard/jobs/[id]/payment`)
- Record payment amount
- Set payment date
- Select payment method
- Add notes

### Client Management Flow

#### View Clients (`/dashboard/clients`)
- List of all clients
- Search and filter clients
- Create new client button

#### Create Client (`/dashboard/clients/new`)
1. **Client Form**
   - Name
   - Email
   - Phone
   - Address
   - Notes

2. **Client Creation**
   - Client saved to `clients` table
   - Linked to user via `user_id`

#### View Client (`/dashboard/clients/[id]`)
- Client details
- Associated jobs list
- Edit and delete actions

#### Edit Client (`/dashboard/clients/[id]/edit`)
- Modify client information
- Save changes

### Finance Flow

#### Finance Dashboard (`/dashboard/finance`)
- **Summary Cards**
  - Total Revenue
  - Total Paid
  - Outstanding Amount
  - Overdue Count

- **Recent Invoices**
  - Invoice number
  - Client name
  - Amount
  - Status (Paid, Overdue, Pending)

- **Recent Payments**
  - Payment amount
  - Client name
  - Payment date
  - Status

- **Recent Expenses**
  - Expense category
  - Job title
  - Amount
  - Date

#### Invoice Generation (`/dashboard/jobs/[id]/invoice/generate`)
- Generate PDF invoice
- Uses Supabase Edge Function
- Downloads invoice PDF

### Calendar Flow

#### Calendar View (`/dashboard/calendar`)
- Monthly calendar view
- Shows jobs by date
- Click job to view details
- Navigate between months

---

## Client Portal Flow

### Portal Link Generation (`/dashboard/jobs/[id]/portal`)
- Generate unique portal link
- Link format: `/p/[portal_id]`
- Copy link to share with client

### Client Portal Access (`/p/[id]`)
1. **Password Protection** (if enabled)
   - Client enters password
   - Unlocks portal access

2. **Portal Content**
   - Job details
   - Deliverables (if unlocked or paid)
   - Invoice information
   - Payment status

3. **Access Control**
   - Deliverables locked until payment (if configured)
   - Password protection (if set)
   - Public access (if no restrictions)

---

## Data Flow Architecture

### Database Structure

```
auth.users (Supabase Auth)
    ↓
public.users (User Profiles)
    ├── role: 'super_admin' | 'admin' | 'user'
    ├── status: 'pending' | 'active' | 'suspended' | 'rejected'
    └── profile_setup_completed: boolean

public.clients
    └── user_id → public.users.id

public.jobs
    ├── user_id → public.users.id
    └── client_id → public.clients.id

public.invoices
    └── job_id → public.jobs.id

public.payments
    └── job_id → public.jobs.id

public.expenses
    └── job_id → public.jobs.id

public.tasks
    └── job_id → public.jobs.id

public.deliverables
    └── job_id → public.jobs.id

public.team_members
    └── job_id → public.jobs.id
```

### Row Level Security (RLS)

- **Users**: Can only view/edit their own profile
- **Super Admins**: Can view all users, manage approvals
- **Clients**: Users can only access their own clients
- **Jobs**: Users can only access their own jobs
- **Invoices/Payments/Expenses**: Inherit job permissions

---

## Route Structure

### Public Routes
- `/` - Landing page
- `/login` - Login page
- `/signup` - Signup page
- `/signup/pending` - Pending approval page
- `/signup/rejected` - Rejected account page
- `/p/[id]` - Client portal (public access)

### Protected Routes (Require Authentication)
- `/dashboard` - Main dashboard
- `/dashboard/jobs` - Jobs list
- `/dashboard/jobs/new` - Create job
- `/dashboard/jobs/[id]` - Job details
- `/dashboard/jobs/[id]/edit` - Edit job
- `/dashboard/jobs/[id]/tasks` - Job tasks
- `/dashboard/jobs/[id]/deliverables` - Job deliverables
- `/dashboard/jobs/[id]/team` - Job team
- `/dashboard/jobs/[id]/invoice` - Job invoice
- `/dashboard/jobs/[id]/invoice/generate` - Generate invoice PDF
- `/dashboard/jobs/[id]/payment` - Record payment
- `/dashboard/jobs/[id]/portal` - Generate portal link
- `/dashboard/clients` - Clients list
- `/dashboard/clients/new` - Create client
- `/dashboard/clients/[id]` - Client details
- `/dashboard/clients/[id]/edit` - Edit client
- `/dashboard/finance` - Finance dashboard
- `/dashboard/calendar` - Calendar view
- `/setup-profile` - Profile setup (after approval)

### Admin Routes (Require Super Admin)
- `/dashboard/admin/users` - User management

---

## Status Transitions

### User Status Flow
```
pending → active (via Super Admin approval)
pending → rejected (via Super Admin rejection)
active → suspended (via Super Admin action)
```

### Job Status Flow
```
Inquiry → Booked → Completed
Inquiry → Cancelled
Booked → Cancelled
```

### Invoice Status Flow
```
Pending → Paid (when payment recorded)
Pending → Overdue (if past due date)
```

---

## Key Features Flow

### 1. Job Creation to Payment
```
Create Job → Create Invoice → Generate PDF → 
Share Portal → Client Views → Client Pays → 
Record Payment → Update Invoice Status
```

### 2. Deliverable Delivery
```
Upload Deliverable → Set Password (optional) → 
Lock/Unlock → Generate Portal Link → 
Client Accesses Portal → Downloads Deliverable
```

### 3. Team Assignment
```
Create Job → Assign Team Members → 
Team Members View Job → Complete Tasks
```

### 4. Expense Tracking
```
Create Job → Add Expenses → 
View in Finance Dashboard → Track Total Costs
```

---

## Error Handling Flow

### Authentication Errors
- Invalid credentials → Show error message
- Account suspended → Show suspension message
- Account rejected → Redirect to rejected page

### Authorization Errors
- Unauthorized access → Redirect to dashboard
- Missing permissions → Show access denied message

### Data Errors
- Missing profile → Auto-create fallback profile
- RLS violation → Show error, log for debugging
- Network errors → Show retry option

---

## Session Management

### Session Lifecycle
1. **Login** → Create session
2. **Activity** → Refresh session automatically
3. **Logout** → Destroy session
4. **Timeout** → Redirect to login

### Session Checks
- Every protected route checks authentication
- Dashboard layout validates user status
- Admin routes check super_admin role

---

## Integration Points

### Supabase Services
- **Auth**: User authentication and sessions
- **Database**: PostgreSQL with RLS
- **Storage**: File uploads (deliverables)
- **Edge Functions**: Invoice PDF generation

### External Services
- **Email** (Future): Approval notifications
- **Payment Gateway** (Future): Stripe integration
- **File Storage** (Future): Cloud storage for deliverables

---

## Security Considerations

### Authentication
- Password hashing via Supabase Auth
- Session management via Supabase
- JWT tokens for API requests

### Authorization
- Row Level Security (RLS) policies
- Role-based access control (RBAC)
- Super Admin approval workflow

### Data Protection
- User data isolation via RLS
- Client data scoped to user
- Job data scoped to user

---

## Future Enhancements

### Planned Features
1. Email notifications for approvals
2. Payment gateway integration
3. Advanced reporting and analytics
4. Mobile app support
5. Multi-language support
6. Advanced search and filtering
7. Export functionality (CSV, PDF)
8. Recurring jobs
9. Client communication portal
10. Automated reminders

---

## Quick Reference

### User Roles
- **super_admin**: Full system access, user management
- **admin**: (Future) Limited admin access
- **user**: Standard user, manages own jobs/clients

### User Statuses
- **pending**: Awaiting approval
- **active**: Approved and active
- **suspended**: Temporarily disabled
- **rejected**: Registration rejected

### Job Statuses
- **Inquiry**: Initial inquiry
- **Booked**: Confirmed booking
- **Completed**: Job finished
- **Cancelled**: Job cancelled

### Invoice Statuses
- **Pending**: Awaiting payment
- **Paid**: Payment received
- **Overdue**: Past due date

---

## Support & Troubleshooting

### Common Issues

1. **"Failed to load user profile"**
   - Check RLS policies
   - Verify user exists in `public.users`
   - Check database connection

2. **"Infinite recursion" error**
   - Run `FIX_INFINITE_RECURSION.sql`
   - Verify RLS policy structure

3. **404 on routes**
   - Check file structure matches route
   - Verify route groups (parentheses) are correct
   - Clear Next.js cache

4. **Permission denied**
   - Verify user role and status
   - Check RLS policies
   - Verify user is authenticated

---

## Version History

- **v1.0.0** - Initial release with multitenancy and approval workflow
- Basic job and client management
- Finance tracking
- Client portal
- Super Admin user management

---

*Last Updated: January 2024*

