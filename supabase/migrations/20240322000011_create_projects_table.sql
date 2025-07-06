CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT 'bg-blue-500',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted BOOLEAN DEFAULT FALSE,
  encryption_iv TEXT,
  encryption_salt TEXT,
  title_encrypted BOOLEAN DEFAULT FALSE,
  title_encryption_iv TEXT,
  title_encryption_salt TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own projects"
ON projects FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
ON projects FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
ON projects FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
ON projects FOR DELETE
USING (auth.uid() = user_id);

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS project_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  unit TEXT,
  completed BOOLEAN DEFAULT FALSE,
  due_date TIMESTAMPTZ,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted BOOLEAN DEFAULT FALSE,
  encryption_iv TEXT,
  encryption_salt TEXT,
  title_encrypted BOOLEAN DEFAULT FALSE,
  title_encryption_iv TEXT,
  title_encryption_salt TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE project_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own project goals"
ON project_goals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own project goals"
ON project_goals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own project goals"
ON project_goals FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own project goals"
ON project_goals FOR DELETE
USING (auth.uid() = user_id);

alter publication supabase_realtime add table projects;
alter publication supabase_realtime add table project_goals;
