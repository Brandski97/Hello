-- Add title encryption fields to notes table
ALTER TABLE notes 
ADD COLUMN IF NOT EXISTS title_encrypted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS title_encryption_iv TEXT,
ADD COLUMN IF NOT EXISTS title_encryption_salt TEXT;

-- Add title encryption fields to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS title_encrypted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS title_encryption_iv TEXT,
ADD COLUMN IF NOT EXISTS title_encryption_salt TEXT;

-- Add title encryption fields to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS title_encrypted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS title_encryption_iv TEXT,
ADD COLUMN IF NOT EXISTS title_encryption_salt TEXT;