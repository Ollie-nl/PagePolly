# PagePolly Database Schema Design

## Implementation approach
We will use Supabase (PostgreSQL) to store all data related to vendors, crawl jobs and crawled content. The schema is designed to:
- Track vendors and their websites
- Monitor crawl job status and history
- Store crawled content with versioning
- Handle relationships between entities efficiently

## Data structures and interfaces

### Tables Structure

1. vendors
```sql
create table vendors (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    website_url text not null,
    status text default 'active',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
```

2. crawl_jobs
```sql
create table crawl_jobs (
    id uuid default gen_random_uuid() primary key,
    vendor_id uuid references vendors(id),
    status text default 'pending',  -- pending, running, completed, failed
    start_time timestamptz,
    end_time timestamptz,
    total_pages integer default 0,
    crawled_pages integer default 0,
    error_message text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
```

3. crawled_pages
```sql
create table crawled_pages (
    id uuid default gen_random_uuid() primary key,
    crawl_job_id uuid references crawl_jobs(id),
    url text not null,
    title text,
    content jsonb,  -- Stores structured content
    meta_data jsonb, -- Stores page metadata
    status text default 'success',
    crawled_at timestamptz default now(),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
```

4. crawl_errors
```sql
create table crawl_errors (
    id uuid default gen_random_uuid() primary key,
    crawl_job_id uuid references crawl_jobs(id),
    page_url text,
    error_type text,
    error_message text,
    created_at timestamptz default now()
);
```

### Indexes
```sql
-- Vendors table indexes
create index idx_vendors_website_url on vendors(website_url);

-- Crawl jobs indexes
create index idx_crawl_jobs_vendor_id on crawl_jobs(vendor_id);
create index idx_crawl_jobs_status on crawl_jobs(status);

-- Crawled pages indexes
create index idx_crawled_pages_crawl_job_id on crawled_pages(crawl_job_id);
create index idx_crawled_pages_url on crawled_pages(url);

-- Crawl errors indexes
create index idx_crawl_errors_crawl_job_id on crawl_errors(crawl_job_id);
```

## Features and Constraints

1. **Automatic Timestamps**
   - All tables include created_at and updated_at timestamps
   - updated_at is automatically updated on record modification

2. **Referential Integrity**
   - Foreign key constraints ensure data consistency
   - Cascade deletes are not enabled to prevent accidental data loss

3. **Status Tracking**
   - Vendors can be active/inactive
   - Crawl jobs have multiple status states
   - Individual crawled pages track success/failure

4. **Content Storage**
   - Crawled content stored as JSONB for flexibility
   - Metadata stored separately for efficient querying

5. **Error Tracking**
   - Dedicated error logging table
   - Detailed error information for debugging

## Usage Examples

1. Start a new crawl job:
```sql
INSERT INTO crawl_jobs (vendor_id, status, start_time)
VALUES ('vendor_uuid', 'running', now());
```

2. Update crawl progress:
```sql
UPDATE crawl_jobs
SET crawled_pages = crawled_pages + 1
WHERE id = 'job_uuid';
```

3. Store crawled content:
```sql
INSERT INTO crawled_pages (crawl_job_id, url, title, content)
VALUES ('job_uuid', 'https://example.com', 'Page Title', '{"key": "value"}');
```

## Security Considerations

1. **Row Level Security (RLS)**
   - Implement RLS policies for multi-tenant security
   - Restrict access based on user organization

2. **Audit Trail**
   - Timestamps track all changes
   - Error logging provides accountability

## Performance Considerations

1. **Indexing Strategy**
   - Indexes on frequently queried columns
   - Composite indexes for common query patterns

2. **JSONB Storage**
   - Efficient storage for variable content
   - Enables complex querying of stored content

3. **Partitioning**
   - Consider partitioning crawled_pages for large datasets
   - Partition by date or vendor_id based on usage patterns