-- Practice vs tournament label for per-student stats.
-- NULL = unlabeled (legacy rounds); excluded from stats.
ALTER TABLE scorecards ADD COLUMN IF NOT EXISTS round_type text
  CHECK (round_type IN ('practice', 'tournament'));

-- Backfill legacy rounds only where the round name says so; "practice" wins if both appear.
UPDATE scorecards SET round_type = 'practice'
  WHERE round_type IS NULL AND tournament_name ILIKE '%practice%';
UPDATE scorecards SET round_type = 'tournament'
  WHERE round_type IS NULL AND tournament_name ILIKE '%tournament%';
