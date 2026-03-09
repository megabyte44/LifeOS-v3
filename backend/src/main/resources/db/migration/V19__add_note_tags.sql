ALTER TABLE notes ADD COLUMN tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE notes ADD COLUMN linked_feature VARCHAR(100);
ALTER TABLE notes ADD COLUMN linked_entity_id UUID;
