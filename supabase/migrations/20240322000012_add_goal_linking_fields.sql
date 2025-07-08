-- Add goal linking fields to tasks, notes, and events tables
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS linked_goal_id UUID REFERENCES project_goals(id) ON DELETE SET NULL;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS linked_goal_id UUID REFERENCES project_goals(id) ON DELETE SET NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS linked_goal_id UUID REFERENCES project_goals(id) ON DELETE SET NULL;
