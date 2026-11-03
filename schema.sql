-- BudgetYoish — Supabase schema
-- Run this once in your Supabase project's SQL Editor (Project → SQL Editor → New Query)
-- Safe to run on a fresh project. Do not run this on a database that already has these tables.

-- ==========================================
-- 1. Create Tables
-- ==========================================

-- A. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    description TEXT,
    category TEXT,
    amount NUMERIC NOT NULL,
    is_income BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- B. User Data Table (JSON store for categories, bill categories, reflections, & bills)
CREATE TABLE IF NOT EXISTS public.user_data (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    data_type TEXT NOT NULL, -- e.g. 'categories', 'bill_categories', 'reflections', 'bills'
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, data_type)
);

-- C. Category Reflections Table (Your Money or Your Life ratings)
CREATE TABLE IF NOT EXISTS public.category_reflections (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_name TEXT NOT NULL,
    month DATE NOT NULL, -- Stored as YYYY-MM-01 (first of the month)
    rating INTEGER NOT NULL CHECK (rating IN (1, 2, 3)), -- 1 = Too little, 2 = Just right, 3 = Too much
    notes TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, category_name, month)
);

-- D. FI Settings Table (Financial independence progress)
CREATE TABLE IF NOT EXISTS public.fi_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    total_invested NUMERIC NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- E. Income Goals Table
CREATE TABLE IF NOT EXISTS public.income_goals (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    target_monthly_income NUMERIC NOT NULL DEFAULT 0,
    target_label TEXT NOT NULL DEFAULT 'Break-even',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- F. Life Energy Settings Table (Hourly net wage formula)
CREATE TABLE IF NOT EXISTS public.life_energy_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    monthly_take_home NUMERIC NOT NULL DEFAULT 0,
    monthly_work_costs NUMERIC NOT NULL DEFAULT 0,
    monthly_work_hours NUMERIC NOT NULL DEFAULT 0,
    monthly_work_overhead_hours NUMERIC NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 2. Enable Row-Level Security (RLS)
-- ==========================================

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fi_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.life_energy_settings ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 3. Create Row-Level Security Policies
-- ==========================================

CREATE POLICY "Users can manage their own transactions"
    ON public.transactions FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own user_data"
    ON public.user_data FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own category_reflections"
    ON public.category_reflections FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own fi_settings"
    ON public.fi_settings FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own income_goals"
    ON public.income_goals FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own life_energy_settings"
    ON public.life_energy_settings FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
