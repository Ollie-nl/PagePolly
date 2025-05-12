-- Enable Row Level Security for all tables
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawls ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- Create policies for sites table
CREATE POLICY "Users can view their own sites"
    ON sites
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sites"
    ON sites
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sites"
    ON sites
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sites"
    ON sites
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create policies for crawls table
CREATE POLICY "Users can view crawls of their sites"
    ON crawls
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM sites
            WHERE sites.id = crawls.site_id
            AND sites.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create crawls for their sites"
    ON crawls
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM sites
            WHERE sites.id = site_id
            AND sites.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update crawls of their sites"
    ON crawls
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM sites
            WHERE sites.id = crawls.site_id
            AND sites.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete crawls of their sites"
    ON crawls
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1
            FROM sites
            WHERE sites.id = crawls.site_id
            AND sites.user_id = auth.uid()
        )
    );

-- Create policies for pages table
CREATE POLICY "Users can view pages of their crawls"
    ON pages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM crawls
            JOIN sites ON sites.id = crawls.site_id
            WHERE crawls.id = pages.crawl_id
            AND sites.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create pages for their crawls"
    ON pages
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM crawls
            JOIN sites ON sites.id = crawls.site_id
            WHERE crawls.id = crawl_id
            AND sites.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update pages of their crawls"
    ON pages
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM crawls
            JOIN sites ON sites.id = crawls.site_id
            WHERE crawls.id = pages.crawl_id
            AND sites.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete pages of their crawls"
    ON pages
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1
            FROM crawls
            JOIN sites ON sites.id = crawls.site_id
            WHERE crawls.id = pages.crawl_id
            AND sites.user_id = auth.uid()
        )
    );