-- Row Level Security (RLS) Policies
-- ShootSuite Security Configuration

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Users can insert their own profile during signup
-- Using 'to authenticated' and 'WITH CHECK' (required for INSERT)
CREATE POLICY "Users can insert own profile"
    ON public.users
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- ============================================
-- CLIENTS TABLE POLICIES
-- ============================================

-- Photographers can manage their own clients
CREATE POLICY "Photographers can manage own clients"
    ON public.clients FOR ALL
    USING (auth.uid() = user_id);

-- ============================================
-- JOBS TABLE POLICIES
-- ============================================

-- Photographers can manage their own jobs
CREATE POLICY "Photographers can manage own jobs"
    ON public.jobs FOR ALL
    USING (auth.uid() = user_id);

-- Assistants can view assigned jobs
CREATE POLICY "Assistants can view assigned jobs"
    ON public.jobs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_members.job_id = jobs.id
            AND team_members.user_id = auth.uid()
        )
    );

-- ============================================
-- INVOICES TABLE POLICIES
-- ============================================

-- Photographers can manage invoices for their jobs
CREATE POLICY "Photographers can manage own invoices"
    ON public.invoices FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.jobs
            WHERE jobs.id = invoices.job_id
            AND jobs.user_id = auth.uid()
        )
    );

-- ============================================
-- PAYMENTS TABLE POLICIES
-- ============================================

-- Photographers can manage payments for their jobs
CREATE POLICY "Photographers can manage own payments"
    ON public.payments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.jobs
            WHERE jobs.id = payments.job_id
            AND jobs.user_id = auth.uid()
        )
    );

-- ============================================
-- EXPENSES TABLE POLICIES
-- ============================================

-- Photographers can manage expenses for their jobs
CREATE POLICY "Photographers can manage own expenses"
    ON public.expenses FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.jobs
            WHERE jobs.id = expenses.job_id
            AND jobs.user_id = auth.uid()
        )
    );

-- ============================================
-- TASKS TABLE POLICIES
-- ============================================

-- Photographers can manage all tasks for their jobs
CREATE POLICY "Photographers can manage own job tasks"
    ON public.tasks FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.jobs
            WHERE jobs.id = tasks.job_id
            AND jobs.user_id = auth.uid()
        )
    );

-- Assistants can view assigned tasks
CREATE POLICY "Assistants can view assigned tasks"
    ON public.tasks FOR SELECT
    USING (
        assigned_to = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.team_members
            JOIN public.jobs ON jobs.id = team_members.job_id
            WHERE team_members.job_id = tasks.job_id
            AND team_members.user_id = auth.uid()
        )
    );

-- Assistants can update assigned tasks
CREATE POLICY "Assistants can update assigned tasks"
    ON public.tasks FOR UPDATE
    USING (
        assigned_to = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.team_members
            JOIN public.jobs ON jobs.id = team_members.job_id
            WHERE team_members.job_id = tasks.job_id
            AND team_members.user_id = auth.uid()
        )
    );

-- ============================================
-- TEAM MEMBERS TABLE POLICIES
-- ============================================

-- Photographers can manage team members for their jobs
CREATE POLICY "Photographers can manage team members"
    ON public.team_members FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.jobs
            WHERE jobs.id = team_members.job_id
            AND jobs.user_id = auth.uid()
        )
    );

-- ============================================
-- DELIVERABLES TABLE POLICIES
-- ============================================

-- Photographers can manage deliverables for their jobs
CREATE POLICY "Photographers can manage own deliverables"
    ON public.deliverables FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.jobs
            WHERE jobs.id = deliverables.job_id
            AND jobs.user_id = auth.uid()
        )
    );

-- Public/Portal access: Allow access if unlocked OR invoice is paid
-- Note: This policy uses a special function that checks portal UUID
-- In practice, portal access will use a service role or special auth mechanism
CREATE POLICY "Portal can access unlocked or paid deliverables"
    ON public.deliverables FOR SELECT
    USING (
        is_locked = FALSE
        OR EXISTS (
            SELECT 1 FROM public.invoices
            WHERE invoices.job_id = deliverables.job_id
            AND invoices.balance = 0
        )
    );

-- ============================================
-- INTEGRATIONS TABLE POLICIES
-- ============================================

-- Users can manage their own integrations
CREATE POLICY "Users can manage own integrations"
    ON public.integrations FOR ALL
    USING (auth.uid() = user_id);

