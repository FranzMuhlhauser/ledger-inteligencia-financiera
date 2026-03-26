-- Fix for spaces RLS policies
-- Run this in Supabase SQL Editor

-- First, drop ALL existing policies on spaces to start fresh
DROP POLICY IF EXISTS "Users can view their own spaces" ON spaces;
DROP POLICY IF EXISTS "Users can insert their own spaces" ON spaces;
DROP POLICY IF EXISTS "Users can update their own spaces" ON spaces;
DROP POLICY IF EXISTS "Users can delete their own spaces" ON spaces;

-- Recreate all policies with proper checks
-- 1. SELECT policy
CREATE POLICY "Users can view their own spaces"
  ON spaces
  FOR SELECT
  USING (auth.uid() = user_id);

-- 2. INSERT policy - user_id must match authenticated user
CREATE POLICY "Users can insert their own spaces"
  ON spaces
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. UPDATE policy
CREATE POLICY "Users can update their own spaces"
  ON spaces
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 4. DELETE policy
CREATE POLICY "Users can delete their own spaces"
  ON spaces
  FOR DELETE
  USING (auth.uid() = user_id);

-- Verify the policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'spaces';
