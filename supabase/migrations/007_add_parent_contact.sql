-- Add optional parent contact fields to profiles (for student rows only)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS parent_email text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS parent_first_name text;
