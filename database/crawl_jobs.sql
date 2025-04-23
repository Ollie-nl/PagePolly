-- database/crawl_jobs.sql
-- Create table for storing crawl jobs
CREATE TABLE IF NOT EXISTS crawl_jobs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  urls TEXT[] NOT NULL,
  status TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  completion_time TIMESTAMP WITH TIME ZONE,
  results JSONB DEFAULT '[]'::jsonb,
  errors JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS crawl_jobs_user_id_idx ON crawl_jobs(user_id);
CREATE INDEX IF NOT EXISTS crawl_jobs_project_id_idx ON crawl_jobs(project_id);
CREATE INDEX IF NOT EXISTS crawl_jobs_status_idx ON crawl_jobs(status);

-- Enable Row Level Security
ALTER TABLE crawl_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies to secure the table
CREATE POLICY "Users can view their own crawl jobs" ON crawl_jobs 
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert their own crawl jobs" ON crawl_jobs 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update their own crawl jobs" ON crawl_jobs 
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update the updated_at column
CREATE TRIGGER update_crawl_jobs_modtime
BEFORE UPDATE ON crawl_jobs
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();