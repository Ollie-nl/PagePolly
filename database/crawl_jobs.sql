-- database/crawl_jobs.sql
-- Create UUID extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the crawl_jobs table to store web crawler job information
CREATE TABLE IF NOT EXISTS crawl_jobs (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  urls TEXT[] NOT NULL,
  results JSONB DEFAULT '[]',
  errors JSONB DEFAULT '[]',
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  completion_time TIMESTAMP WITH TIME ZONE,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS crawl_jobs_project_id_idx ON crawl_jobs(project_id);
CREATE INDEX IF NOT EXISTS crawl_jobs_user_id_idx ON crawl_jobs(user_id);
CREATE INDEX IF NOT EXISTS crawl_jobs_status_idx ON crawl_jobs(status);

-- Enable Row Level Security to protect data
ALTER TABLE crawl_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies to secure data access

-- Users can only view their own crawl jobs
CREATE POLICY "Users can view their own crawl jobs"
  ON crawl_jobs FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create crawl jobs only for their own projects
CREATE POLICY "Users can create crawl jobs for their projects"
  ON crawl_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM projects
    WHERE id = project_id AND user_id = auth.uid()
  ));

-- Service role or the job owner can update crawl jobs
-- This is necessary for the crawler service to update job status and results
CREATE POLICY "Service role can update crawl jobs"
  ON crawl_jobs FOR UPDATE
  USING (auth.uid() = user_id OR (auth.jwt() ? auth.jwt()->>'role' = 'service_role' : false));
  
-- Users can delete their own crawl jobs
CREATE POLICY "Users can delete their own crawl jobs"
  ON crawl_jobs FOR DELETE
  USING (auth.uid() = user_id);