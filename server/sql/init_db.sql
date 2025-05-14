-- server/sql/init_db.sql
-- SQL functions to create tables for Puppeteer crawler

-- Function to create the crawl jobs table
CREATE OR REPLACE FUNCTION create_function_create_crawl_jobs_table_ohxp1d()
RETURNS void AS $$
BEGIN
  -- Create the function that will create the crawl jobs table
  CREATE OR REPLACE FUNCTION create_crawl_jobs_table_ohxp1d()
  RETURNS void AS $func$
  BEGIN
    -- Check if table exists
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'crawl_jobs_ohxp1d') THEN
      -- Create the table
      CREATE TABLE public.crawl_jobs_ohxp1d (
        id UUID PRIMARY KEY,
        user_email TEXT NOT NULL,
        vendor_id TEXT,
        urls TEXT[] NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled', 'partial')),
        progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
        error TEXT,
        settings JSONB,
        creation_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        completion_time TIMESTAMP WITH TIME ZONE
      );

      -- Set up RLS (Row Level Security)
      ALTER TABLE public.crawl_jobs_ohxp1d ENABLE ROW LEVEL SECURITY;
      
      -- Create policy to allow users to read only their own data
      CREATE POLICY "Users can read their own jobs" 
        ON public.crawl_jobs_ohxp1d FOR SELECT 
        USING (auth.jwt() ->> 'email' = user_email);
      
      -- Create policy to allow users to insert their own data
      CREATE POLICY "Users can insert their own jobs" 
        ON public.crawl_jobs_ohxp1d FOR INSERT 
        WITH CHECK (auth.jwt() ->> 'email' = user_email);
      
      -- Create policy to allow users to update their own data
      CREATE POLICY "Users can update their own jobs" 
        ON public.crawl_jobs_ohxp1d FOR UPDATE 
        USING (auth.jwt() ->> 'email' = user_email);

      -- Create index on user_email for faster lookups
      CREATE INDEX crawl_jobs_ohxp1d_user_email_idx ON public.crawl_jobs_ohxp1d(user_email);
      
      RAISE NOTICE 'Table crawl_jobs_ohxp1d created successfully';
    ELSE
      RAISE NOTICE 'Table crawl_jobs_ohxp1d already exists';
    END IF;
  END;
  $func$ LANGUAGE plpgsql;
END;
$$ LANGUAGE plpgsql;

-- Function to create the crawl results table
CREATE OR REPLACE FUNCTION create_function_create_crawl_results_table_ohxp1d()
RETURNS void AS $$
BEGIN
  -- Create the function that will create the crawl results table
  CREATE OR REPLACE FUNCTION create_crawl_results_table_ohxp1d()
  RETURNS void AS $func$
  BEGIN
    -- Check if table exists
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'crawl_results_ohxp1d') THEN
      -- Create the table
      CREATE TABLE public.crawl_results_ohxp1d (
        id SERIAL PRIMARY KEY,
        job_id UUID NOT NULL REFERENCES public.crawl_jobs_ohxp1d(id) ON DELETE CASCADE,
        vendor_id TEXT,
        url TEXT NOT NULL,
        status TEXT NOT NULL,
        data JSONB,
        screenshot TEXT, -- Base64 encoded screenshot
        crawl_duration INTEGER, -- Duration in milliseconds
        retry_count INTEGER DEFAULT 0,
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );

      -- Set up RLS (Row Level Security)
      ALTER TABLE public.crawl_results_ohxp1d ENABLE ROW LEVEL SECURITY;

      -- Create policy to allow users to read their own data
      CREATE POLICY "Users can read their own results" 
        ON public.crawl_results_ohxp1d FOR SELECT 
        USING (
          EXISTS (
            SELECT 1 FROM public.crawl_jobs_ohxp1d 
            WHERE id = crawl_results_ohxp1d.job_id AND user_email = auth.jwt() ->> 'email'
          )
        );

      -- Create policy to allow users to insert their own data
      CREATE POLICY "Users can insert results for their own jobs" 
        ON public.crawl_results_ohxp1d FOR INSERT 
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.crawl_jobs_ohxp1d 
            WHERE id = crawl_results_ohxp1d.job_id AND user_email = auth.jwt() ->> 'email'
          )
        );

      -- Create index on job_id for faster lookups and joins
      CREATE INDEX crawl_results_ohxp1d_job_id_idx ON public.crawl_results_ohxp1d(job_id);

      RAISE NOTICE 'Table crawl_results_ohxp1d created successfully';
    ELSE
      RAISE NOTICE 'Table crawl_results_ohxp1d already exists';
    END IF;
  END;
  $func$ LANGUAGE plpgsql;
END;
$$ LANGUAGE plpgsql;

-- Function to create the crawl errors table
CREATE OR REPLACE FUNCTION create_function_create_crawl_errors_table_ohxp1d()
RETURNS void AS $$
BEGIN
  -- Create the function that will create the crawl errors table
  CREATE OR REPLACE FUNCTION create_crawl_errors_table_ohxp1d()
  RETURNS void AS $func$
  BEGIN
    -- Check if table exists
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'crawl_errors_ohxp1d') THEN
      -- Create the table
      CREATE TABLE public.crawl_errors_ohxp1d (
        id SERIAL PRIMARY KEY,
        job_id UUID NOT NULL REFERENCES public.crawl_jobs_ohxp1d(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        error TEXT NOT NULL,
        is_blocking BOOLEAN DEFAULT FALSE,
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );

      -- Set up RLS (Row Level Security)
      ALTER TABLE public.crawl_errors_ohxp1d ENABLE ROW LEVEL SECURITY;

      -- Create policy to allow users to read their own data
      CREATE POLICY "Users can read their own errors" 
        ON public.crawl_errors_ohxp1d FOR SELECT 
        USING (
          EXISTS (
            SELECT 1 FROM public.crawl_jobs_ohxp1d 
            WHERE id = crawl_errors_ohxp1d.job_id AND user_email = auth.jwt() ->> 'email'
          )
        );

      -- Create policy to allow users to insert their own data
      CREATE POLICY "Users can insert errors for their own jobs" 
        ON public.crawl_errors_ohxp1d FOR INSERT 
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.crawl_jobs_ohxp1d 
            WHERE id = crawl_errors_ohxp1d.job_id AND user_email = auth.jwt() ->> 'email'
          )
        );

      -- Create index on job_id for faster lookups and joins
      CREATE INDEX crawl_errors_ohxp1d_job_id_idx ON public.crawl_errors_ohxp1d(job_id);

      RAISE NOTICE 'Table crawl_errors_ohxp1d created successfully';
    ELSE
      RAISE NOTICE 'Table crawl_errors_ohxp1d already exists';
    END IF;
  END;
  $func$ LANGUAGE plpgsql;
END;
$$ LANGUAGE plpgsql;

-- Function to create the vendor configs table
CREATE OR REPLACE FUNCTION create_function_create_vendor_configs_table_ohxp1d()
RETURNS void AS $$
BEGIN
  -- Create the function that will create the vendor configs table
  CREATE OR REPLACE FUNCTION create_vendor_configs_table_ohxp1d()
  RETURNS void AS $func$
  BEGIN
    -- Check if table exists
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'vendor_configs_ohxp1d') THEN
      -- Create the table
      CREATE TABLE public.vendor_configs_ohxp1d (
        id SERIAL PRIMARY KEY,
        vendor_id TEXT UNIQUE NOT NULL,
        config JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );

      -- Set up RLS (Row Level Security)
      ALTER TABLE public.vendor_configs_ohxp1d ENABLE ROW LEVEL SECURITY;

      -- Create policies for access control
      -- For now, make vendor configs readable by all authenticated users
      CREATE POLICY "Anyone can read vendor configs" 
        ON public.vendor_configs_ohxp1d FOR SELECT 
        TO authenticated;

      -- Only allow admins to insert or update vendor configs
      -- This is a simplified approach - you might want more granular control
      CREATE POLICY "Only admins can modify vendor configs" 
        ON public.vendor_configs_ohxp1d 
        USING (auth.jwt() ->> 'role' = 'admin')
        WITH CHECK (auth.jwt() ->> 'role' = 'admin');

      -- Create index on vendor_id for faster lookups
      CREATE INDEX vendor_configs_ohxp1d_vendor_id_idx ON public.vendor_configs_ohxp1d(vendor_id);

      -- Create trigger to update the updated_at timestamp automatically
      CREATE OR REPLACE FUNCTION update_vendor_configs_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER update_vendor_configs_updated_at_trigger
      BEFORE UPDATE ON public.vendor_configs_ohxp1d
      FOR EACH ROW EXECUTE FUNCTION update_vendor_configs_updated_at();

      RAISE NOTICE 'Table vendor_configs_ohxp1d created successfully';
    ELSE
      RAISE NOTICE 'Table vendor_configs_ohxp1d already exists';
    END IF;
  END;
  $func$ LANGUAGE plpgsql;
END;
$$ LANGUAGE plpgsql;

-- Function to create the test crawls table
CREATE OR REPLACE FUNCTION create_function_create_test_crawls_table_ohxp1d()
RETURNS void AS $$
BEGIN
  -- Create the function that will create the test crawls table
  CREATE OR REPLACE FUNCTION create_test_crawls_table_ohxp1d()
  RETURNS void AS $func$
  BEGIN
    -- Check if table exists
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'test_crawls_ohxp1d') THEN
      -- Create the table
      CREATE TABLE public.test_crawls_ohxp1d (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        url TEXT NOT NULL,
        method TEXT NOT NULL,
        user_email TEXT NOT NULL,
        success BOOLEAN NOT NULL,
        duration INTEGER,
        error TEXT,
        data JSONB,
        screenshot TEXT,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT fk_user
          FOREIGN KEY (user_email)
          REFERENCES auth.users (email)
          ON DELETE CASCADE
      );

      -- Set up RLS (Row Level Security)
      ALTER TABLE public.test_crawls_ohxp1d ENABLE ROW LEVEL SECURITY;
      
      -- Create policy to allow users to read only their own test crawls
      CREATE POLICY "Users can read their own test crawls" 
        ON public.test_crawls_ohxp1d FOR SELECT 
        USING (auth.jwt() ->> 'email' = user_email);
      
      -- Create policy to allow users to insert their own test crawls
      CREATE POLICY "Users can insert their own test crawls" 
        ON public.test_crawls_ohxp1d FOR INSERT 
        WITH CHECK (auth.jwt() ->> 'email' = user_email);

      -- Create index on user_email for faster lookups
      CREATE INDEX test_crawls_ohxp1d_user_email_idx ON public.test_crawls_ohxp1d(user_email);
      -- Create index on timestamp for faster sorting
      CREATE INDEX test_crawls_ohxp1d_timestamp_idx ON public.test_crawls_ohxp1d(timestamp DESC);

      RAISE NOTICE 'Table test_crawls_ohxp1d created successfully';
    ELSE
      RAISE NOTICE 'Table test_crawls_ohxp1d already exists';
    END IF;
  END;
  $func$ LANGUAGE plpgsql;
END;
$$ LANGUAGE plpgsql;

-- Instructions to run these functions in Supabase:
-- 1. Open your Supabase project
-- 2. Go to the SQL Editor
-- 3. Paste this entire file and execute it
-- 4. After execution, the functions will be available to call from your application
-- Note: You need to run these functions through the Supabase client to create the tables