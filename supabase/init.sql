-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create sites table
CREATE TABLE sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
    UNIQUE(user_id, url)
);

-- Create crawls table
CREATE TABLE crawls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    total_pages INTEGER DEFAULT 0,
    crawled_pages INTEGER DEFAULT 0,
    error_message TEXT
);

-- Create pages table (replacing existing if any)
DROP TABLE IF EXISTS pages CASCADE;
CREATE TABLE pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crawl_id UUID REFERENCES crawls(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    content TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'crawled', 'error')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(crawl_id, url)
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for sites table
CREATE TRIGGER update_sites_updated_at
    BEFORE UPDATE ON sites
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_sites_user_id ON sites(user_id);
CREATE INDEX idx_crawls_site_id ON crawls(site_id);
CREATE INDEX idx_pages_crawl_id ON pages(crawl_id);
CREATE INDEX idx_pages_url ON pages(url);
