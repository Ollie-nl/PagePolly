-- Tabel voor sessies
CREATE TABLE sessions (
    id UUID PRIMARY KEY,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    root_url VARCHAR(255) NOT NULL
);

-- Tabel voor gecrawlde URLs
CREATE TABLE crawled_urls (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    url VARCHAR(255) NOT NULL,
    product_name_found BOOLEAN,
    found_in JSONB,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);
