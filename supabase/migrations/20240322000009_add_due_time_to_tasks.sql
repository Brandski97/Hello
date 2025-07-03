-- Add due_time field to tasks table for separate time tracking
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_time TIME;

-- Update existing tasks to extract time from due_date if it exists
UPDATE tasks 
SET due_time = due_date::time 
WHERE due_date IS NOT NULL AND due_time IS NULL;
