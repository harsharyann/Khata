-- SQL Schema setup for Finance Buddy application
-- Run this in your Supabase SQL Editor.

-- 1. Create INCOMES table
CREATE TABLE IF NOT EXISTS incomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    date DATE NOT NULL,
    amount NUMERIC NOT NULL,
    category TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid() NOT NULL
);

-- Enable RLS for incomes
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own incomes" 
    ON incomes FOR ALL 
    USING (auth.uid() = user_id);

-- 2. Create EXPENSES table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    date DATE NOT NULL,
    amount NUMERIC NOT NULL,
    category TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid() NOT NULL
);

-- Enable RLS for expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own expenses" 
    ON expenses FOR ALL 
    USING (auth.uid() = user_id);

-- 3. Create BANKS table
CREATE TABLE IF NOT EXISTS banks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "bankName" TEXT NOT NULL,
    type TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    balance NUMERIC NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid() NOT NULL
);

-- Enable RLS for banks
ALTER TABLE banks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own banks" 
    ON banks FOR ALL 
    USING (auth.uid() = user_id);

-- 4. Create CREDIT CARDS table
CREATE TABLE IF NOT EXISTS credit_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "bankName" TEXT NOT NULL,
    "cardName" TEXT NOT NULL,
    "cardNumber" TEXT NOT NULL,
    "limit" NUMERIC NOT NULL,
    outstanding NUMERIC NOT NULL,
    "statementDate" TEXT,
    "dueDate" TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid() NOT NULL
);

-- Enable RLS for credit_cards
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own credit cards" 
    ON credit_cards FOR ALL 
    USING (auth.uid() = user_id);

-- 5. Create BORROWERS table
CREATE TABLE IF NOT EXISTS borrowers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    principal NUMERIC NOT NULL,
    repaid NUMERIC NOT NULL,
    date DATE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid() NOT NULL
);

-- Enable RLS for borrowers
ALTER TABLE borrowers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own borrowers" 
    ON borrowers FOR ALL 
    USING (auth.uid() = user_id);

-- 6. Create profiles or cash configurations (since cash is single value)
-- We can store cash in a simple settings table per user
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    cash NUMERIC DEFAULT 5000 NOT NULL
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own profile" 
    ON profiles FOR ALL 
    USING (auth.uid() = id);

-- Create a trigger to automatically create a profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, cash)
    VALUES (new.id, 5000);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
