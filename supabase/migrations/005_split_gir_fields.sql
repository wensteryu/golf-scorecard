-- Split GIR into gir_hit (boolean) + pin_position (text array)
ALTER TABLE hole_scores ADD COLUMN IF NOT EXISTS gir_hit boolean;
ALTER TABLE hole_scores ADD COLUMN IF NOT EXISTS pin_position text[];

-- Migrate existing data
UPDATE hole_scores SET gir_hit = true WHERE gir = 'hit';
UPDATE hole_scores SET gir_hit = false, pin_position = ARRAY['left'] WHERE gir = 'left';
UPDATE hole_scores SET gir_hit = false, pin_position = ARRAY['right'] WHERE gir = 'right';
UPDATE hole_scores SET gir_hit = false, pin_position = ARRAY['short'] WHERE gir = 'short';
UPDATE hole_scores SET gir_hit = false, pin_position = ARRAY['over'] WHERE gir = 'over';
UPDATE hole_scores SET gir_hit = false, pin_position = ARRAY['pin_high'] WHERE gir = 'pin_high';

-- Drop old constraint and column
DO $$
BEGIN
  ALTER TABLE hole_scores DROP CONSTRAINT IF EXISTS hole_scores_gir_check;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

ALTER TABLE hole_scores DROP COLUMN IF EXISTS gir;
