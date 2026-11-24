-- ============================================================
-- Loy Krathong Web App - Supabase PostgreSQL Schema
-- Project: gulhecqxxmxhhtioxgxo
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/gulhecqxxmxhhtioxgxo/sql/new
-- ============================================================

-- 1. Create wishes table
CREATE TABLE IF NOT EXISTS public.wishes (
    id TEXT PRIMARY KEY,
    name1 TEXT DEFAULT '',
    name2 TEXT DEFAULT '',
    "tagText" TEXT DEFAULT '',
    wish TEXT DEFAULT '',
    letter TEXT DEFAULT '',
    "baseType" TEXT DEFAULT 'banana-leaf',
    "flowerType" TEXT DEFAULT 'lotus-bud',
    "candleColor" TEXT DEFAULT 'gold',
    "coinType" TEXT DEFAULT 'gold',
    "isCoupleMode" BOOLEAN DEFAULT TRUE,
    "createdAt" TEXT DEFAULT '',
    "formattedDate" TEXT DEFAULT '',
    "formattedTime" TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.wishes ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if any
DROP POLICY IF EXISTS "Public select wishes" ON public.wishes;
DROP POLICY IF EXISTS "Public insert wishes" ON public.wishes;
DROP POLICY IF EXISTS "Public update wishes" ON public.wishes;
DROP POLICY IF EXISTS "Public delete wishes" ON public.wishes;

-- 4. Create policies to allow public reading and writing
CREATE POLICY "Public select wishes" ON public.wishes
    FOR SELECT USING (true);

CREATE POLICY "Public insert wishes" ON public.wishes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update wishes" ON public.wishes
    FOR UPDATE USING (true);

CREATE POLICY "Public delete wishes" ON public.wishes
    FOR DELETE USING (true);

-- 5. Create index for fast sorting by creation date
CREATE INDEX IF NOT EXISTS idx_wishes_created_at ON public.wishes (created_at DESC);
