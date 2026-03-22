-- ============================================================
-- PagePolly Database Schema
-- Run this in the Supabase SQL editor to set up all tables
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- VENDORS
-- Stores the vendor/site configurations to monitor
-- ============================================================
CREATE TABLE IF NOT EXISTS vendors (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  url         TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'inactive')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, url)
);

-- ============================================================
-- CRAWL JOBS
-- Tracks each crawl run (one job = one or more URLs)
-- ============================================================
CREATE TABLE IF NOT EXISTS crawl_jobs (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email     TEXT NOT NULL,
  vendor_id      UUID REFERENCES vendors(id) ON DELETE SET NULL,
  urls           JSONB NOT NULL DEFAULT '[]',
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'running', 'completed', 'partial', 'failed', 'cancelled')),
  progress       INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  settings       JSONB DEFAULT '{}',
  error          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at   TIMESTAMPTZ
);

-- ============================================================
-- CRAWL RESULTS
-- One row per successfully crawled URL within a job
-- ============================================================
CREATE TABLE IF NOT EXISTS crawl_results (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id          UUID NOT NULL REFERENCES crawl_jobs(id) ON DELETE CASCADE,
  vendor_id       UUID REFERENCES vendors(id) ON DELETE SET NULL,
  url             TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'success',
  data            JSONB DEFAULT '{}',
  screenshot      TEXT,                       -- base64 encoded image
  crawl_duration  INTEGER,                    -- milliseconds
  retry_count     INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CRAWL ERRORS
-- One row per failed URL within a job
-- ============================================================
CREATE TABLE IF NOT EXISTS crawl_errors (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id      UUID NOT NULL REFERENCES crawl_jobs(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  error       TEXT NOT NULL,
  is_blocking BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CRAWLER CONFIGS
-- Puppeteer configuration profiles (managed in Settings)
-- ============================================================
CREATE TABLE IF NOT EXISTS crawler_configs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email  TEXT NOT NULL,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'puppeteer',
  options     JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- UPDATED_AT TRIGGER
-- Automatically keeps updated_at current
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER crawler_configs_updated_at
  BEFORE UPDATE ON crawler_configs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_vendors_user_id        ON vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_crawl_jobs_user_email  ON crawl_jobs(user_email);
CREATE INDEX IF NOT EXISTS idx_crawl_jobs_vendor_id   ON crawl_jobs(vendor_id);
CREATE INDEX IF NOT EXISTS idx_crawl_jobs_status      ON crawl_jobs(status);
CREATE INDEX IF NOT EXISTS idx_crawl_results_job_id   ON crawl_results(job_id);
CREATE INDEX IF NOT EXISTS idx_crawl_errors_job_id    ON crawl_errors(job_id);
CREATE INDEX IF NOT EXISTS idx_crawler_configs_email  ON crawler_configs(user_email);

-- ============================================================
-- ROW LEVEL SECURITY
-- Every user can only see and modify their own data
-- ============================================================

-- vendors
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY vendors_select ON vendors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY vendors_insert ON vendors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY vendors_update ON vendors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY vendors_delete ON vendors FOR DELETE USING (auth.uid() = user_id);

-- crawl_jobs (matched by user_email because backend uses service role)
ALTER TABLE crawl_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY crawl_jobs_select ON crawl_jobs
  FOR SELECT USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY crawl_jobs_insert ON crawl_jobs
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY crawl_jobs_update ON crawl_jobs
  FOR UPDATE USING (auth.jwt() ->> 'email' = user_email);

-- crawl_results (accessible if the parent job belongs to the user)
ALTER TABLE crawl_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY crawl_results_select ON crawl_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM crawl_jobs
      WHERE crawl_jobs.id = crawl_results.job_id
        AND crawl_jobs.user_email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY crawl_results_insert ON crawl_results
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM crawl_jobs
      WHERE crawl_jobs.id = job_id
        AND crawl_jobs.user_email = auth.jwt() ->> 'email'
    )
  );

-- crawl_errors (same as results)
ALTER TABLE crawl_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY crawl_errors_select ON crawl_errors
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM crawl_jobs
      WHERE crawl_jobs.id = crawl_errors.job_id
        AND crawl_jobs.user_email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY crawl_errors_insert ON crawl_errors
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM crawl_jobs
      WHERE crawl_jobs.id = job_id
        AND crawl_jobs.user_email = auth.jwt() ->> 'email'
    )
  );

-- crawler_configs
ALTER TABLE crawler_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY crawler_configs_select ON crawler_configs
  FOR SELECT USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY crawler_configs_insert ON crawler_configs
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_email);

CREATE POLICY crawler_configs_update ON crawler_configs
  FOR UPDATE USING (auth.jwt() ->> 'email' = user_email);

CREATE POLICY crawler_configs_delete ON crawler_configs
  FOR DELETE USING (auth.jwt() ->> 'email' = user_email);
