-- Add updated_at column to notes table, defaulting to created_at for existing rows
ALTER TABLE notes ADD COLUMN updated_at TIMESTAMPTZ;
UPDATE notes SET updated_at = created_at WHERE updated_at IS NULL;
ALTER TABLE notes ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE notes ALTER COLUMN updated_at SET DEFAULT NOW();
