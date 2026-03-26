-- Fix for spaces delete issue
-- Run this in Supabase SQL Editor

-- First, drop existing policies to avoid duplicates
DROP POLICY IF EXISTS "Users can delete their own spaces" ON spaces;

-- Recreate the delete policy with explicit check
CREATE POLICY "Users can delete their own spaces"
  ON spaces
  FOR DELETE
  USING (auth.uid() = user_id);

-- Verify the policy exists
SELECT * FROM pg_policies WHERE tablename = 'spaces';
