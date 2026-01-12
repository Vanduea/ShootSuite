# Database Schema Documentation

## Overview

ShootSuite uses PostgreSQL via Supabase with Row Level Security (RLS) for data isolation.

## Entity Relationship Diagram

```
Users (1) ──< (N) Clients
Users (1) ──< (N) Jobs
Clients (1) ──< (N) Jobs
Jobs (1) ──< (N) Invoices
Jobs (1) ──< (N) Payments
Jobs (1) ──< (N) Expenses
Jobs (1) ──< (N) Tasks
Jobs (1) ──< (N) Deliverables
Jobs (1) ──< (N) Team Members
Users (1) ──< (N) Integrations
```

## Tables

### users

Extended user profile (base auth handled by Supabase Auth).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key, references auth.users |
| email | VARCHAR(255) | User email |
| name | VARCHAR(255) | Full name |
| avatar_url | TEXT | Profile picture URL |
| branding_logo | TEXT | Custom logo URL |
| branding_primary_color | VARCHAR(7) | Primary brand color (hex) |
| branding_secondary_color | VARCHAR(7) | Secondary brand color (hex) |
| created_at | TIMESTAMP | Account creation |
| updated_at | TIMESTAMP | Last update |

### clients

Client information.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to users (photographer) |
| name | VARCHAR(255) | Client name |
| email | VARCHAR(255) | Email address |
| phone | VARCHAR(50) | Phone number |
| company | VARCHAR(255) | Company name |
| address | TEXT | Billing address |
| notes | TEXT | Internal notes |
| created_at | TIMESTAMP | Record creation |
| updated_at | TIMESTAMP | Last update |

### jobs

Photography jobs/shoots.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to users (photographer) |
| client_id | UUID | FK to clients |
| title | VARCHAR(255) | Job title |
| date | DATE | Shoot date |
| start_time | TIME | Start time |
| end_time | TIME | End time |
| timezone | VARCHAR(50) | Time zone |
| location | VARCHAR(500) | Location |
| package_type | VARCHAR(100) | Package type |
| status | VARCHAR(50) | Workflow status |
| price | DECIMAL(10,2) | Total price |
| deposit_amount | DECIMAL(10,2) | Deposit amount |
| notes | TEXT | Notes |
| shot_list | JSONB | Shot checklist |
| gear_checklist | JSONB | Gear checklist |
| created_at | TIMESTAMP | Record creation |
| updated_at | TIMESTAMP | Last update |

**Status Values:** Inquiry, Booked, Shooting, Editing, Review, Delivered, Completed, Cancelled

### invoices

Invoices for jobs.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| job_id | UUID | FK to jobs |
| invoice_number | VARCHAR(50) | Unique invoice number |
| total_amount | DECIMAL(10,2) | Total amount |
| paid_amount | DECIMAL(10,2) | Amount paid |
| balance | DECIMAL(10,2) | Generated: total - paid |
| due_date | DATE | Due date |
| status | VARCHAR(50) | Invoice status |
| pdf_url | TEXT | PDF file URL |
| created_at | TIMESTAMP | Record creation |
| updated_at | TIMESTAMP | Last update |

**Status Values:** Draft, Sent, Paid, Partially Paid, Overdue, Cancelled

### payments

Payment records.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| invoice_id | UUID | FK to invoices (nullable) |
| job_id | UUID | FK to jobs |
| amount | DECIMAL(10,2) | Payment amount |
| type | VARCHAR(50) | Payment type |
| status | VARCHAR(50) | Payment status |
| date | DATE | Payment date |
| method | VARCHAR(50) | Payment method |
| transaction_id | VARCHAR(255) | External transaction ID |
| notes | TEXT | Notes |
| created_at | TIMESTAMP | Record creation |

**Type Values:** Deposit, Final, Refund  
**Status Values:** Pending, Completed, Failed, Refunded  
**Method Values:** Stripe, PayPal, Cash, Check, Bank Transfer

### expenses

Job expenses.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| job_id | UUID | FK to jobs |
| category | VARCHAR(100) | Expense category |
| amount | DECIMAL(10,2) | Expense amount |
| date | DATE | Expense date |
| notes | TEXT | Notes |
| receipt_url | TEXT | Receipt file URL |
| created_at | TIMESTAMP | Record creation |

### tasks

Job tasks/subtasks.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| job_id | UUID | FK to jobs |
| description | VARCHAR(500) | Task description |
| due_date | DATE | Due date |
| assigned_to | UUID | FK to users (assistant) |
| is_done | BOOLEAN | Completion status |
| priority | VARCHAR(20) | Priority level |
| created_at | TIMESTAMP | Record creation |
| completed_at | TIMESTAMP | Completion timestamp |

**Priority Values:** Low, Medium, High

### team_members

Assistant assignments (junction table).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| job_id | UUID | FK to jobs |
| user_id | UUID | FK to users (assistant) |
| role | VARCHAR(50) | Role name |
| access_level | VARCHAR(50) | Access level |
| created_at | TIMESTAMP | Record creation |

### deliverables

Delivery links/galleries (polymorphic).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| job_id | UUID | FK to jobs |
| method | ENUM | Delivery method |
| external_url | TEXT | For external_link method |
| drive_folder_id | TEXT | For drive_integration method |
| provider | VARCHAR(50) | Cloud provider |
| is_locked | BOOLEAN | Lock status |
| password | TEXT | Optional password |
| expires_at | TIMESTAMP | Expiration date |
| download_count | INTEGER | Download count |
| access_log | JSONB | Access log entries |
| created_at | TIMESTAMP | Record creation |
| updated_at | TIMESTAMP | Last update |

**Method Values:** external_link, drive_integration  
**Provider Values:** Google, Dropbox, OneDrive, None

### integrations

OAuth tokens for cloud storage.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to users |
| provider | VARCHAR(50) | Provider name |
| access_token | TEXT | Encrypted OAuth token |
| refresh_token | TEXT | Encrypted refresh token |
| expires_at | TIMESTAMP | Token expiry |
| created_at | TIMESTAMP | Record creation |
| updated_at | TIMESTAMP | Last update |

**Provider Values:** google, dropbox

## Indexes

- `clients`: (user_id, email)
- `jobs`: (user_id, status, date), (client_id), full-text on (title, notes)
- `invoices`: (job_id, status), (due_date)
- `payments`: (invoice_id), (job_id, status, date)
- `expenses`: (job_id)
- `tasks`: (job_id), (assigned_to)
- `team_members`: (job_id), (user_id)
- `deliverables`: (job_id, is_locked)
- `integrations`: (user_id, provider)

## Triggers

1. **update_updated_at_column**: Updates `updated_at` timestamp on row updates
2. **generate_invoice_number**: Auto-generates invoice numbers
3. **update_invoice_balance**: Updates invoice balance when payments are made
4. **unlock_deliverables_on_payment**: Unlocks deliverables when invoice is paid

## Row Level Security (RLS)

All tables have RLS enabled with policies:

- **Photographers**: Full access to their own data
- **Assistants**: Read-only access to assigned jobs
- **Public/Portal**: Limited access to deliverables (unlocked or paid)

See `supabase/migrations/20240101000001_rls_policies.sql` for detailed policies.

