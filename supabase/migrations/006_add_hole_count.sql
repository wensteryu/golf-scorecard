-- Add hole_count to scorecards (9 or 18, default 18)
ALTER TABLE scorecards ADD COLUMN IF NOT EXISTS hole_count integer NOT NULL DEFAULT 18;
