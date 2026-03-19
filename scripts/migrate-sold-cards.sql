-- ============================================================
-- Migration: Add sold card tracking columns
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Add sale tracking columns to cards table
ALTER TABLE cards ADD COLUMN IF NOT EXISTS sale_price NUMERIC DEFAULT NULL;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS sold_at TIMESTAMPTZ DEFAULT NULL;

-- Add card image URL columns (for future image storage)
ALTER TABLE cards ADD COLUMN IF NOT EXISTS front_image_url TEXT DEFAULT NULL;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS back_image_url TEXT DEFAULT NULL;
