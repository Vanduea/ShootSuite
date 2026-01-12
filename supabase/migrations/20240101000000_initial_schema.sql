-- ShootSuite Database Schema
-- Initial migration for v1.0

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Note: Row Level Security is enabled per table below
-- JWT secret is managed by Supabase automatically

-- ============================================
-- CORE TABLES
-- ============================================

-- Users (Extended Profile - Supabase Auth handles base auth)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    branding_logo TEXT,
    branding_primary_color VARCHAR(7) DEFAULT '#0ea5e9',
    branding_secondary_color VARCHAR(7) DEFAULT '#0284c7',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clients
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    address TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jobs
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    title VARCHAR(255),
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    timezone VARCHAR(50) DEFAULT 'UTC',
    location VARCHAR(500),
    package_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Inquiry' CHECK (status IN ('Inquiry', 'Booked', 'Shooting', 'Editing', 'Review', 'Delivered', 'Completed', 'Cancelled')),
    price DECIMAL(10,2) NOT NULL,
    deposit_amount DECIMAL(10,2),
    notes TEXT,
    shot_list JSONB DEFAULT '[]'::jsonb,
    gear_checklist JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    balance DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    due_date DATE,
    status VARCHAR(50) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Paid', 'Partially Paid', 'Overdue', 'Cancelled')),
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    type VARCHAR(50) CHECK (type IN ('Deposit', 'Final', 'Refund')),
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Failed', 'Refunded')),
    date DATE NOT NULL,
    method VARCHAR(50) CHECK (method IN ('Stripe', 'PayPal', 'Cash', 'Check', 'Bank Transfer')),
    transaction_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    receipt_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    description VARCHAR(500) NOT NULL,
    due_date DATE,
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    is_done BOOLEAN DEFAULT FALSE,
    priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Team Members (Junction Table)
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role VARCHAR(50),
    access_level VARCHAR(50) DEFAULT 'Limited',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(job_id, user_id)
);

-- ============================================
-- DELIVERY TABLES
-- ============================================

-- Deliverables (Polymorphic)
CREATE TYPE delivery_method AS ENUM ('external_link', 'drive_integration');

CREATE TABLE IF NOT EXISTS public.deliverables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    method delivery_method NOT NULL,
    external_url TEXT,
    drive_folder_id TEXT,
    provider VARCHAR(50) CHECK (provider IN ('Google', 'Dropbox', 'OneDrive', 'None')),
    is_locked BOOLEAN DEFAULT TRUE,
    password TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    download_count INTEGER DEFAULT 0,
    access_log JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (
        (method = 'external_link' AND external_url IS NOT NULL) OR
        (method = 'drive_integration' AND drive_folder_id IS NOT NULL)
    )
);

-- Integrations (OAuth Tokens)
CREATE TABLE IF NOT EXISTS public.integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('google', 'dropbox')),
    access_token TEXT NOT NULL, -- Encrypted via Supabase Vault
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

-- ============================================
-- INDEXES
-- ============================================

-- Clients indexes
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);

-- Jobs indexes
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON public.jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_client_id ON public.jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_date ON public.jobs(date);
CREATE INDEX IF NOT EXISTS idx_jobs_user_status_date ON public.jobs(user_id, status, date);

-- Full-text search on jobs
CREATE INDEX IF NOT EXISTS idx_jobs_title_notes_fts ON public.jobs USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(notes, '')));

-- Invoices indexes
CREATE INDEX IF NOT EXISTS idx_invoices_job_id ON public.invoices(job_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_job_id ON public.payments(job_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(date);

-- Expenses indexes
CREATE INDEX IF NOT EXISTS idx_expenses_job_id ON public.expenses(job_id);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_job_id ON public.tasks(job_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);

-- Team Members indexes
CREATE INDEX IF NOT EXISTS idx_team_members_job_id ON public.team_members(job_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);

-- Deliverables indexes
CREATE INDEX IF NOT EXISTS idx_deliverables_job_id ON public.deliverables(job_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_is_locked ON public.deliverables(is_locked);

-- Integrations indexes
CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON public.integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_provider ON public.integrations(provider);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deliverables_updated_at BEFORE UPDATE ON public.deliverables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON public.integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        NEW.invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTRING(NEW.id::text, 1, 8);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_invoice_number_trigger BEFORE INSERT ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();

-- Function to update invoice balance when payment is made
CREATE OR REPLACE FUNCTION update_invoice_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE public.invoices
        SET paid_amount = (
            SELECT COALESCE(SUM(amount), 0)
            FROM public.payments
            WHERE invoice_id = NEW.invoice_id
            AND status = 'Completed'
        ),
        status = CASE
            WHEN (SELECT COALESCE(SUM(amount), 0) FROM public.payments WHERE invoice_id = NEW.invoice_id AND status = 'Completed') >= total_amount THEN 'Paid'
            WHEN (SELECT COALESCE(SUM(amount), 0) FROM public.payments WHERE invoice_id = NEW.invoice_id AND status = 'Completed') > 0 THEN 'Partially Paid'
            WHEN due_date < CURRENT_DATE AND (SELECT COALESCE(SUM(amount), 0) FROM public.payments WHERE invoice_id = NEW.invoice_id AND status = 'Completed') < total_amount THEN 'Overdue'
            ELSE status
        END
        WHERE id = NEW.invoice_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invoice_balance_trigger AFTER INSERT OR UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION update_invoice_balance();

-- Function to unlock deliverables when invoice is paid
CREATE OR REPLACE FUNCTION unlock_deliverables_on_payment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'Completed' AND OLD.status != 'Completed' THEN
        UPDATE public.deliverables
        SET is_locked = FALSE
        WHERE job_id = NEW.job_id
        AND EXISTS (
            SELECT 1 FROM public.invoices
            WHERE job_id = NEW.job_id
            AND balance = 0
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER unlock_deliverables_trigger AFTER UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION unlock_deliverables_on_payment();

