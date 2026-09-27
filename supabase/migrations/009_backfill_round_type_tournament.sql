-- Legacy rounds without "practice" in the name are tournaments (event names like JTNC, AJGA).
-- Applied to production 2026-09-26.
UPDATE scorecards SET round_type = 'tournament' WHERE round_type IS NULL;
