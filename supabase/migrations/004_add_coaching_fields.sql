-- Step 1: Drop the old GIR constraint FIRST (must happen before data migration)
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  WHERE rel.relname = 'hole_scores'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) LIKE '%gir%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE hole_scores DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

-- Step 2: Add 4 new coaching fields
ALTER TABLE hole_scores ADD COLUMN IF NOT EXISTS fairway_miss_distance int;
ALTER TABLE hole_scores ADD COLUMN IF NOT EXISTS club_used text;
ALTER TABLE hole_scores ADD COLUMN IF NOT EXISTS approach_distance int;
ALTER TABLE hole_scores ADD COLUMN IF NOT EXISTS first_putt_result text CHECK (first_putt_result IN ('made','short','over','high_side','low_side'));

-- Step 3: Migrate existing 'long' GIR values to 'over' (safe now that old constraint is dropped)
UPDATE hole_scores SET gir = 'over' WHERE gir = 'long';

-- Step 4: Add new GIR constraint with 'over' and 'pin_high'
ALTER TABLE hole_scores ADD CONSTRAINT hole_scores_gir_check
  CHECK (gir IN ('hit', 'left', 'right', 'short', 'over', 'pin_high'));
