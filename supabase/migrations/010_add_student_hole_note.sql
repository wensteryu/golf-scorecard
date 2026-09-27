-- Students can jot a note per hole during practice rounds.
ALTER TABLE hole_scores ADD COLUMN IF NOT EXISTS student_note text;
