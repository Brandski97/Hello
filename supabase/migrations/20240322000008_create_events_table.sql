CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  link TEXT,
  color TEXT DEFAULT 'bg-blue-500',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  linked_note UUID REFERENCES notes(id) ON DELETE SET NULL,
  linked_task UUID REFERENCES tasks(id) ON DELETE SET NULL,
  encrypted BOOLEAN DEFAULT false,
  encryption_iv TEXT,
  encryption_salt TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

alter publication supabase_realtime add table events;
