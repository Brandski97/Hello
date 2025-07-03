ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access their own notes" ON notes;
CREATE POLICY "Users can only access their own notes"
ON notes FOR ALL
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only access their own tasks" ON tasks;
CREATE POLICY "Users can only access their own tasks"
ON tasks FOR ALL
USING (auth.uid() = user_id);

alter publication supabase_realtime add table notes;
alter publication supabase_realtime add table tasks;