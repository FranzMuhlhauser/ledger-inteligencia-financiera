-- Fix Security Advisor Warning: Function Search Path Mutable
-- Run this in Supabase SQL Editor to fix the warning
-- =====================================================

-- Recreate the function with proper search_path setting
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- The triggers will continue to work with the updated function
-- No need to recreate them
