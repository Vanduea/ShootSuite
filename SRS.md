# 📄 SHOOTSUITE: Software Requirements Specification (SRS)
**System:** Photographer Job Manager
**Architecture:** Serverless PWA (Next.js + Supabase)
**Version:** 1.3
**Date:** 2024

---

## 1. Introduction

### 1.1 Purpose
The Photographer Job Manager (ShootSuite) is a Progressive Web App (PWA) designed to streamline the workflow of freelance and studio photographers. It manages shoots, finances, and delivery through a "Serverless" architecture, minimizing overhead while maximizing functionality via the user's existing cloud storage.

### 1.2 Scope
The system will:
- Operate as a unified **Progressive Web App (PWA)** installable on Desktop, iOS, and Android.
- Manage the "Shoot → Edit → Deliver" lifecycle via a Kanban board.
- **Hybrid Delivery Model:** Allow photographers to deliver assets via:
    1.  **Link Wrapper:** Locking a simple external URL (WeTransfer/Pixieset) behind an invoice.
    2.  **BYO Storage:** Direct API integration with the photographer's Google Drive/Dropbox.
- Handle Invoicing and Payment tracking (Stripe).
- Provide a branded Client Portal for contract signing and asset access.

**Out of Scope:**
- Native Mobile App development (iOS IPA / Android APK).
- Direct file hosting on ShootSuite servers (System acts as a gateway/indexer only).

---

## 2. Overall Description

### 2.1 Product Perspective
The system is a **Serverless SaaS** application. It leverages **Supabase** for backend infrastructure (Auth, Database, Edge Functions), removing the need for traditional server management. It is designed as a "Local-First" PWA to support offline functionality for critical shoot data.

### 2.2 Tech Stack & Operating Environment

#### 2.2.1 Frontend (PWA)
- **Framework:** Next.js (React)
- **Styling:** Tailwind CSS
- **PWA Features:** Service Workers for offline caching, `manifest.json` for installability.
- **State Management:** TanStack Query (with `persistQueryClient` for offline sync).

#### 2.2.2 Backend (Serverless)
- **Platform:** **Supabase**
- **Database:** PostgreSQL (managed by Supabase).
- **Authentication:** Supabase Auth (JWT).
- **Logic:** Supabase Edge Functions (Deno/Node) for payment webhooks and complex delivery logic.

#### 2.2.3 Storage Model (The Hybrid Approach)
- **Internal Storage:** Supabase Storage (strictly for User Avatars and Invoice PDFs).
- **Client Asset Storage:** **User-Owned (BYO).** The system integrates with Google Drive API / Dropbox API or stores reference URLs.

#### 2.2.4 PWA Requirements
- **PWA-REQ1:** System shall provide `manifest.json` with app name, icons, theme colors.
- **PWA-REQ2:** System shall register Service Worker for offline functionality.
- **PWA-REQ3:** System shall support "Add to Home Screen" on iOS, Android, and Desktop.
- **PWA-REQ4:** System shall provide app icons in multiple sizes (192x192, 512x512).

---

## 3. Specific Requirements

### 3.1 Functional Requirements

#### A. Job & Workflow (PWA Core)

**FR1:** System shall allow creation of jobs with client, date, location, package, and price.
- **FR1.1:** Client, date, and price are mandatory fields.
- **FR1.2:** System shall prevent duplicate jobs (same client + date within 24 hours) with warning.
- **FR1.3:** System shall support time zone selection for shoot dates.
- **FR1.4:** System shall provide predefined package types (Wedding, Portrait, Event, Commercial, Other) with customizable fields.
- **FR1.5:** System shall support multi-day shoots (start date, end date).
- **FR1.6:** System shall allow job templates for recurring job types.

**FR2:** System shall provide a calendar view with drag-and-drop scheduling.
- **FR2.1:** System shall detect and warn about scheduling conflicts (overlapping shoots).
- **FR2.2:** System shall support time-of-day specification (start time, end time).
- **FR2.3:** System shall display jobs in monthly, weekly, and daily views.
- **FR2.4:** System shall allow filtering by client, location, package type, status.

**FR3:** System shall allow attaching shot lists, gear checklists, and team members.
- **FR3.1:** Shot lists shall support checkboxes for tracking completion.
- **FR3.2:** Gear checklists shall be reusable templates.
- **FR3.3:** Team members (assistants) shall be assignable with role specification.

#### B. Workflow Pipeline

**FR4:** System shall represent jobs in Kanban stages (Inquiry → Booked → Shooting → Editing → Review → Delivered → Completed).
- **FR4.1:** System shall allow customizing stage names (configurable per photographer).
- **FR4.2:** System shall display job count per stage.
- **FR4.3:** System shall support filtering jobs within each stage.

**FR5:** System shall allow moving jobs between stages via drag-and-drop.
- **FR5.1:** System shall prevent invalid state transitions (e.g., cannot move from Completed backward).
- **FR5.2:** System shall support undo operation (within 5 seconds).
- **FR5.3:** System shall log all status changes with timestamp and user.

**FR6:** System shall trigger automated tasks when status changes.
- **FR6.1:** System shall provide configurable workflow automation rules.
- **FR6.2:** System shall allow photographers to create custom task templates.
- **FR6.3:** Example: "Shoot Complete" → auto-create "Backup SD Cards" and "Cull RAWs" tasks.
- **FR6.4:** System shall support conditional triggers (e.g., "If payment received, then unlock delivery").

#### C. Finance & Payments

**FR7:** System shall generate PDF invoices.
- **FR7.1:** Invoices shall include photographer branding (logo, colors).
- **FR7.2:** Invoices shall comply with local tax regulations (configurable fields).
- **FR7.3:** Invoices shall be downloadable and email-able.
- **FR7.4:** System shall auto-generate invoices when job status changes to "Booked".
- **FR7.5:** PDF invoices shall be generated server-side via Supabase Edge Function (using library like `pdfkit` or `puppeteer`).
- **FR7.6:** Generated PDFs shall be stored in Supabase Storage and linked in the `invoices` table.

**FR8:** System shall track payment statuses (Deposit Paid, Pending, Overdue, Paid in Full, Partially Paid, Refunded).
- **FR8.1:** System shall support partial payments and track remaining balance.
- **FR8.2:** System shall track refunds and cancellations.
- **FR8.3:** System shall send automated payment reminders (configurable intervals: 7, 14, 30 days).
- **FR8.4:** System shall calculate overdue status based on invoice due date.
- **FR8.5:** System shall integrate with payment gateways for automatic status updates.
- **FR8.6:** System shall handle Stripe webhooks (payment.succeeded, payment.failed, invoice.paid).
- **FR8.7:** System shall implement idempotency for webhook processing (prevent duplicate updates).
- **FR8.8:** System shall log all webhook events for audit purposes.

**FR9:** System shall log expenses per job (travel, gear, assistants, other).
- **FR9.1:** Expenses shall be categorized with custom categories support.
- **FR9.2:** System shall calculate profit per job (Revenue - Expenses).
- **FR9.3:** System shall support expense attachments (receipts, invoices).
*Note: All data must be cached locally via Service Worker to ensure Job Details are viewable offline.*

#### D. Delivery & Cloud Integration

**FR10:** System shall support two distinct Delivery Methods.

**FR10:** System shall support two distinct Delivery Methods.
- **FR10.1 - Option A (Link Wrapper):**
    - User pastes an external URL (e.g., WeTransfer, Pixieset).
    - System stores the URL securely.
    - Client Portal renders a "Locked" button that unlocks only upon payment.
- **FR10.2 - Option B (BYO Storage Integration):**
    - User connects their Google Drive/Dropbox account via OAuth2.
    - User selects a specific folder for the Job.
    - System fetches file metadata (thumbnails, filenames) via API to display a branded gallery within the Portal.
    - **Note:** Actual files remain on the user's cloud; bandwidth is handled by the provider.
- **FR10.3:** System shall handle API failures gracefully (show error message, allow retry).
- **FR10.4:** System shall cache file metadata to reduce API calls.
- **FR10.5:** System shall refresh OAuth tokens automatically when expired.

**FR11:** Delivery Access Control.
- **FR11.1:** System shall verify `Invoice.Balance == 0` before revealing the External Link or loading the API Gallery.
- **FR11.2:** System shall allow "Manual Override" (Photographer can unlock delivery even if unpaid).

#### E. Client Portal

**FR12:** The Client Portal shall be a lightweight web view.
- **FR12.1:** Accessed via a unique UUID hash (e.g., `shootsuite.app/p/uuid`).
- **FR12.2:** Portal displays:
    - Photographer Branding (Logo/Colors).
    - Job Status (e.g., "Editing in Progress" or "Ready").
    - Financials (Pay Invoice button).
    - Deliverables (The Link or The Gallery).
- **FR12.3:** Portal UUIDs shall be cryptographically secure (not sequential).
- **FR12.4:** Portal access shall be rate-limited to prevent brute force.
- **FR12.5:** Portal shall support optional password protection (in addition to payment lock).

#### F. Authentication & Authorization

**FR13:** System shall support email/password registration and login via Supabase Auth.
- **FR13.1:** Password requirements: minimum 8 characters, at least one uppercase, one lowercase, one number.
- **FR13.2:** System shall hash passwords using Supabase Auth (bcrypt).

**FR14:** System shall support OAuth providers (Google, Apple) for photographer login.
- **FR14.1:** System shall allow linking OAuth accounts to existing email accounts.

**FR15:** System shall implement Row Level Security (RLS) policies for data isolation.
- **FR15.1:** Photographers can only access their own data (enforced via RLS).
- **FR15.2:** Assistants can only access jobs assigned to them.

**FR16:** System shall support assistant invitations with time-limited access tokens.
- **FR16.1:** Invitation emails shall expire in 7 days.
- **FR16.2:** Assistants shall have access only to assigned jobs.

#### G. Offline Functionality & Sync

**FR17:** System shall support offline viewing of job data.
- **FR17.1:** Service Worker shall cache job list and job details for offline access.
- **FR17.2:** System shall indicate sync status in UI (synced, syncing, offline).

**FR18:** System shall handle offline edits with conflict resolution.
- **FR18.1:** System shall queue offline actions (create job, update status) and sync when online.
- **FR18.2:** System shall use last-write-wins conflict resolution strategy.
- **FR18.3:** System shall notify user of sync conflicts when they occur.

**FR19:** System shall persist critical data locally for offline access.
- **FR19.1:** TanStack Query shall persist "Job List" JSON to `localStorage`.
- **FR19.2:** When device reconnects, system shall re-fetch from Supabase to ensure consistency.

---

## 4. Data Model (Supabase / PostgreSQL)

The schema is optimized for the Hybrid Delivery model.

### 4.1 Core Tables

#### Users (Supabase Auth + Extended Profile)
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key (from Supabase Auth) |
| email | VARCHAR(255) | User email (from Supabase Auth) |
| name | VARCHAR(255) | User full name |
| avatar_url | TEXT | Profile picture URL (Supabase Storage) |
| branding_logo | TEXT | Custom logo URL |
| branding_primary_color | VARCHAR(7) | Primary brand color (hex) |
| branding_secondary_color | VARCHAR(7) | Secondary brand color (hex) |
| created_at | TIMESTAMP | Account creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

#### Clients
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| user_id | UUID | FK to Users (photographer who owns this client) |
| name | VARCHAR(255) | Client full name |
| email | VARCHAR(255) | Client email address |
| phone | VARCHAR(50) | Client phone number |
| company | VARCHAR(255) | Company name (optional) |
| address | TEXT | Billing address |
| notes | TEXT | Internal notes about client |
| created_at | TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

#### Jobs
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| user_id | UUID | FK to Users (photographer) |
| client_id | UUID | FK to Clients |
| title | VARCHAR(255) | Job title (auto-generated if not provided) |
| date | DATE | Shoot date |
| start_time | TIME | Shoot start time |
| end_time | TIME | Shoot end time |
| timezone | VARCHAR(50) | Time zone for shoot (default 'UTC') |
| location | VARCHAR(500) | Shoot location |
| package_type | VARCHAR(100) | Package type (Wedding, Portrait, etc.) |
| status | VARCHAR(50) | Current workflow stage (default 'Inquiry') |
| price | DECIMAL(10,2) | Total job price |
| deposit_amount | DECIMAL(10,2) | Deposit amount (default 50% of price) |
| notes | TEXT | Internal notes |
| shot_list | JSONB | Shot list checklist |
| gear_checklist | JSONB | Gear checklist |
| created_at | TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

**Status Values:** Inquiry, Booked, Shooting, Editing, Review, Delivered, Completed, Cancelled

#### Invoices
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| job_id | UUID | FK to Jobs |
| invoice_number | VARCHAR(50) | Unique invoice number |
| total_amount | DECIMAL(10,2) | Total invoice amount |
| paid_amount | DECIMAL(10,2) | Amount paid so far |
| balance | DECIMAL(10,2) | Remaining balance (total - paid) |
| due_date | DATE | Invoice due date |
| status | VARCHAR(50) | Invoice status |
| pdf_url | TEXT | PDF file URL (Supabase Storage) |
| created_at | TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

**Status Values:** Draft, Sent, Paid, Partially Paid, Overdue, Cancelled

#### Payments
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| invoice_id | UUID | FK to Invoices |
| job_id | UUID | FK to Jobs |
| amount | DECIMAL(10,2) | Payment amount |
| type | VARCHAR(50) | Payment type (Deposit, Final, Refund) |
| status | VARCHAR(50) | Payment status |
| date | DATE | Payment date |
| method | VARCHAR(50) | Payment method (Stripe, PayPal, Cash, Check, Bank Transfer) |
| transaction_id | VARCHAR(255) | External transaction ID (from Stripe/PayPal) |
| notes | TEXT | Payment notes |
| created_at | TIMESTAMP | Record creation timestamp |

**Status Values:** Pending, Completed, Failed, Refunded

#### Expenses
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| job_id | UUID | FK to Jobs |
| category | VARCHAR(100) | Expense category |
| amount | DECIMAL(10,2) | Expense amount |
| date | DATE | Expense date |
| notes | TEXT | Expense notes |
| receipt_url | TEXT | Receipt file URL (Supabase Storage) |
| created_at | TIMESTAMP | Record creation timestamp |

#### Tasks
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| job_id | UUID | FK to Jobs |
| description | VARCHAR(500) | Task description |
| due_date | DATE | Task due date |
| assigned_to | UUID | FK to Users (assigned assistant) |
| is_done | BOOLEAN | Completion status (default false) |
| priority | VARCHAR(20) | Priority level (Low, Medium, High) |
| created_at | TIMESTAMP | Record creation timestamp |
| completed_at | TIMESTAMP | Completion timestamp |

#### Team Members (Junction Table)
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| job_id | UUID | FK to Jobs |
| user_id | UUID | FK to Users (assistant) |
| role | VARCHAR(50) | Role (Second Shooter, Assistant, etc.) |
| access_level | VARCHAR(50) | Access level (default 'Limited') |
| created_at | TIMESTAMP | Record creation timestamp |

### 4.2 Delivery Tables

#### Deliverables (Polymorphic)
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| job_id | UUID | FK to Jobs |
| **method** | ENUM | `'external_link'` OR `'drive_integration'` |
| **external_url** | TEXT | Used if method = 'external_link' |
| **drive_folder_id** | TEXT | Used if method = 'drive_integration' (API ID) |
| **provider** | VARCHAR | 'Google', 'Dropbox', 'OneDrive', 'None' |
| is_locked | BOOLEAN | Logic based on payment status |
| password | TEXT | Optional password protection |
| expires_at | TIMESTAMP | Link expiration date |
| download_count | INT | Track clicks/access (default 0) |
| access_log | JSONB | Access log entries |
| created_at | TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

#### Integrations (Auth Tokens)
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary Key |
| user_id | UUID | FK to Users |
| provider | VARCHAR | 'google', 'dropbox' |
| access_token | TEXT | Encrypted OAuth token (Supabase Vault) |
| refresh_token | TEXT | Encrypted Refresh token (Supabase Vault) |
| expires_at | TIMESTAMP | Token expiry |
| created_at | TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### 4.3 Indexes
- **Clients:** Index on (user_id, email)
- **Jobs:** Index on (user_id, status, date), Index on (client_id), Full-text index on (title, notes)
- **Invoices:** Index on (job_id, status), Index on (due_date)
- **Payments:** Index on (invoice_id, status, date), Index on (job_id)
- **Deliverables:** Index on (job_id, is_locked)
- **Integrations:** Index on (user_id, provider)

---

## 5. System Architecture (Visual)

This diagram represents the Serverless PWA flow.



### 5.1 Data Flow
1.  **Photographer (PWA):** Interacts with Next.js frontend. Data syncs to Supabase PostgreSQL.
2.  **Authentication:** Handled directly by Supabase Auth (Client -> Supabase).
3.  **Payment Events:** Stripe Webhook -> Supabase Edge Function -> Update `invoices` table -> Update `deliverables` lock status.
4.  **Delivery (Option A):** Client Portal -> Checks DB Permissions -> Redirects to `external_url`.
5.  **Delivery (Option B):** Client Portal -> Checks DB Permissions -> Edge Function calls Google Drive API using User's Token -> Returns file list to Frontend.

---

## 6. API & Security (Supabase)

### 6.1 Row Level Security (RLS)
Since we are using Supabase, **RLS is the primary security barrier.**

#### 6.1.1 Photographer Policies
* **Policy 1 (Jobs):** `SELECT/INSERT/UPDATE/DELETE` on `jobs` where `auth.uid() == user_id`.
* **Policy 2 (Clients):** `SELECT/INSERT/UPDATE/DELETE` on `clients` where `auth.uid() == user_id`.
* **Policy 3 (Invoices):** `SELECT/INSERT/UPDATE` on `invoices` where `job_id` exists in `jobs` with `user_id = auth.uid()`.
* **Policy 4 (Payments):** `SELECT/INSERT/UPDATE` on `payments` where `job_id` exists in `jobs` with `user_id = auth.uid()`.
* **Policy 5 (Expenses):** `SELECT/INSERT/UPDATE/DELETE` on `expenses` where `job_id` exists in `jobs` with `user_id = auth.uid()`.
* **Policy 6 (Deliverables):** `SELECT/INSERT/UPDATE` on `deliverables` where `job_id` exists in `jobs` with `user_id = auth.uid()`.

#### 6.1.2 Assistant Policies
* **Policy 7 (Jobs - Read Only):** `SELECT` on `jobs` where `id` exists in `team_members` table for `auth.uid()`.
* **Policy 8 (Tasks):** `SELECT/UPDATE` on `tasks` where `assigned_to = auth.uid()` OR `job_id` exists in `team_members` for `auth.uid()`.

#### 6.1.3 Public/Portal Policies
* **Policy 9 (Deliverables - Portal Access):** `SELECT` on `deliverables` where `id` matches the portal UUID AND (`is_locked = false` OR EXISTS (SELECT 1 FROM invoices WHERE invoices.job_id = deliverables.job_id AND invoices.balance = 0)).

**Note:** Portal access uses a special UUID-based authentication that bypasses normal RLS. The UUID is cryptographically secure and acts as a shared secret.

### 6.2 Supabase Edge Functions

#### 6.2.1 Function: `stripe-webhook`
- **Purpose:** Handles Stripe payment events, updates invoices, unlocks deliverables.
- **Triggers:** Stripe webhook events (payment.succeeded, payment.failed, invoice.paid).
- **Actions:**
  - Updates `payments` table with payment status.
  - Updates `invoices.balance` and `invoices.status`.
  - Unlocks `deliverables.is_locked` when balance reaches zero.
  - Implements idempotency using webhook event IDs.

#### 6.2.2 Function: `drive-gallery`
- **Purpose:** Fetches file metadata from Google Drive/Dropbox for gallery display.
- **Input:** `deliverable_id`, `user_id`
- **Actions:**
  - Retrieves OAuth token from `integrations` table.
  - Calls cloud storage API to fetch folder contents.
  - Returns file list with thumbnails and metadata.
  - Caches results to reduce API calls.

#### 6.2.3 Function: `token-refresh`
- **Purpose:** Refreshes OAuth tokens for cloud storage integrations.
- **Triggers:** Scheduled cron job or on-demand when token expires.
- **Actions:**
  - Refreshes expired tokens using refresh_token.
  - Updates `integrations` table with new tokens.
  - Handles refresh failures gracefully.

#### 6.2.4 Function: `generate-invoice-pdf`
- **Purpose:** Generates PDF invoices server-side.
- **Input:** `invoice_id`
- **Actions:**
  - Fetches invoice and job data.
  - Generates PDF using `pdfkit` or `puppeteer`.
  - Uploads PDF to Supabase Storage.
  - Updates `invoices.pdf_url`.

### 6.3 Offline Capability
* **Service Worker:** Caches the App Shell (HTML/CSS/JS) and static assets.
* **Data Sync:** TanStack Query persists the "Job List" JSON to `localStorage`. When the device reconnects, it re-fetches from Supabase to ensure consistency.
* **Conflict Resolution:** Last-write-wins strategy for offline edits. System notifies user of conflicts.

### 6.4 Token Encryption
* **OAuth Tokens:** Stored in Supabase Vault (encrypted at rest) or application-level encryption.
* **Token Refresh:** Automatic refresh before expiry via Edge Function cron job.
* **Revocation:** Users can revoke integrations at any time, which deletes tokens from database.

---

## 7. Non-Functional Requirements

### 7.1 Performance
- **NFR1:** System shall support 100+ concurrent users (Supabase handles scaling automatically).
- **NFR2:** API responses shall complete within 2 seconds (95th percentile).
- **NFR3:** Database queries shall complete within 500ms for 95th percentile.
- **NFR4:** PWA shall load initial page within 3 seconds on 3G connection.
- **NFR5:** File metadata caching shall reduce API calls by 80% for repeated access.

### 7.2 Security
- **NFR6:** All data shall be encrypted in transit (TLS 1.3) and at rest (Supabase encryption).
- **NFR7:** OAuth tokens shall be encrypted using Supabase Vault.
- **NFR8:** API endpoints shall implement rate limiting (100 requests/minute per user).
- **NFR9:** Portal UUIDs shall be cryptographically secure (UUID v4).
- **NFR10:** System shall log all authentication attempts and failed logins.

### 7.3 Reliability
- **NFR11:** System shall maintain 99.9% uptime SLA (Supabase infrastructure).
- **NFR12:** System shall implement graceful error handling with user-friendly messages.
- **NFR13:** System shall log all errors for monitoring and debugging.
- **NFR14:** System shall implement health check endpoints for monitoring.

### 7.4 Usability
- **NFR15:** PWA shall work offline for viewing jobs (read-only mode).
- **NFR16:** System shall comply with WCAG 2.1 Level AA accessibility standards.
- **NFR17:** Web app shall support Chrome, Firefox, Safari, Edge (last 2 versions).
- **NFR18:** System shall provide in-app help tooltips and contextual help.

### 7.5 Compliance
- **NFR19:** System shall comply with GDPR (data export, deletion via Supabase features).
- **NFR20:** System shall maintain audit logs for financial transactions.
- **NFR21:** System shall support data export functionality for user data portability.

---

## 8. Testing Requirements

### 8.1 Test Strategy
- **Unit Testing:** Critical business logic (payment calculations, access control) - Target: 80% code coverage.
- **Integration Testing:** All Supabase RLS policies, Edge Functions, Stripe webhooks.
- **End-to-End Testing:** Critical user flows (create job, process payment, unlock delivery).
- **PWA Testing:** Offline functionality, service worker updates, installation flow.
- **Security Testing:** Penetration testing, vulnerability scanning, OAuth flow validation.

### 8.2 Test Environments
- **Development:** Local development environment with Supabase local instance.
- **Staging:** Pre-production environment with production-like Supabase project.
- **Production:** Live environment (limited testing only).

### 8.3 Test Data
- Test/sandbox accounts for Stripe (test mode).
- Cloud storage test accounts (Google Drive test account).
- Sample data sets for various scenarios (jobs, clients, invoices).

### 8.4 Acceptance Criteria
- All High-priority functional requirements implemented and tested.
- Performance benchmarks met (<2s response time, 99.9% uptime).
- Security audit passed (OAuth, RLS policies, token encryption).
- PWA installability verified on iOS, Android, and Desktop.
- Offline functionality tested and working.
- UAT sign-off from stakeholders.

---

## 9. Implementation Plan (Revised)

### Phase 1: The "Link Wrapper" MVP (Weeks 1-4)
* **Goal:** A working PWA where users can track jobs and lock external links behind invoices.
* **Tech:** Next.js + Supabase Auth/DB.
* **Features:**
  - User registration and authentication
  - Job creation and management
  - Kanban workflow board
  - Client management
  - Basic invoice generation (PDF)
  - External link delivery (Option A)
  - Client portal (basic)
* **No API Integrations** yet (User manually pastes links).

### Phase 2: Payments & Automations (Weeks 5-8)
* **Goal:** Automated payment processing and delivery unlocking.
* **Tech:** Stripe Integration + Supabase Edge Functions.
* **Features:**
  - Stripe payment integration
  - Webhook handling (Edge Function)
  - Automatic invoice status updates
  - Automatic delivery unlocking on payment
  - Payment reminders (email)
  - Expense tracking
  - Profit calculation

### Phase 3: The "BYO Storage" Integration (Weeks 9-12)
* **Goal:** Google Drive/Dropbox API connection and gallery view.
* **Tech:** OAuth2 management, Edge Functions for API calls, Gallery UI component.
* **Features:**
  - OAuth2 integration setup (Google Drive, Dropbox)
  - Token management and refresh
  - Folder selection UI
  - Gallery component in Client Portal
  - File metadata caching
  - Error handling for API failures

---

## 10. Requirements for "BYO Storage" (User Guide)

To enable Option B, the user (Photographer) must:
1.  Authorize ShootSuite to access their Google Drive (Scope: `drive.readonly`).
2.  Ensure their Google Drive folder sharing permissions are set correctly (or use the API to generate temporary signed links).
3.  Select the specific folder for each job's deliverables.
4.  System will automatically refresh OAuth tokens when they expire.

**Security Notes:**
- Tokens are encrypted and stored securely in Supabase Vault.
- Users can revoke access at any time from Settings.
- System only requests read-only access to user's Drive.

---

## 11. Glossary

- **PWA (Progressive Web App):** A web application that uses modern web capabilities to provide a native app-like experience.
- **RLS (Row Level Security):** Database-level security feature that restricts access to rows based on user identity.
- **BYO (Bring Your Own):** Model where users provide their own cloud storage instead of system hosting files.
- **Edge Function:** Serverless function running on Supabase's edge network for backend logic.
- **OAuth2:** Authorization framework for secure API access without sharing passwords.
- **Service Worker:** JavaScript worker that runs in the background, enabling offline functionality and caching.

---

**End of SRS v1.3**