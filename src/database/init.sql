-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Create pages table
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  title TEXT NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  "order" INTEGER NOT NULL
);

-- Create elements table
CREATE TABLE IF NOT EXISTS elements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  "order" INTEGER NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects(user_id);
CREATE INDEX IF NOT EXISTS pages_project_id_idx ON pages(project_id);
CREATE INDEX IF NOT EXISTS pages_order_idx ON pages("order");
CREATE INDEX IF NOT EXISTS elements_page_id_idx ON elements(page_id);
CREATE INDEX IF NOT EXISTS elements_order_idx ON elements("order");

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE elements ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Projects policies
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Pages policies
CREATE POLICY "Users can view pages of their projects"
  ON pages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = pages.project_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can create pages in their projects"
  ON pages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = pages.project_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update pages in their projects"
  ON pages FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = pages.project_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete pages in their projects"
  ON pages FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = pages.project_id
    AND projects.user_id = auth.uid()
  ));

-- Elements policies
CREATE POLICY "Users can view elements of their pages"
  ON elements FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM pages
    JOIN projects ON projects.id = pages.project_id
    WHERE pages.id = elements.page_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can create elements in their pages"
  ON elements FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM pages
    JOIN projects ON projects.id = pages.project_id
    WHERE pages.id = elements.page_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update elements in their pages"
  ON elements FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM pages
    JOIN projects ON projects.id = pages.project_id
    WHERE pages.id = elements.page_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete elements in their pages"
  ON elements FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM pages
    JOIN projects ON projects.id = pages.project_id
    WHERE pages.id = elements.page_id
    AND projects.user_id = auth.uid()
  ));

-- Create function to auto-increment order
CREATE OR REPLACE FUNCTION get_next_order(p_table_name text, p_parent_column text, p_parent_id uuid)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  next_order integer;
BEGIN
  EXECUTE format('SELECT COALESCE(MAX("order") + 1, 0) FROM %I WHERE %I = $1', p_table_name, p_parent_column)
  INTO next_order
  USING p_parent_id;
  RETURN next_order;
END;
$$;

-- Create triggers for auto-incrementing order
CREATE OR REPLACE FUNCTION set_page_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."order" IS NULL THEN
    NEW."order" := get_next_order('pages', 'project_id', NEW.project_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_page_order_trigger
BEFORE INSERT ON pages
FOR EACH ROW
EXECUTE FUNCTION set_page_order();

CREATE OR REPLACE FUNCTION set_element_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."order" IS NULL THEN
    NEW."order" := get_next_order('elements', 'page_id', NEW.page_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_element_order_trigger
BEFORE INSERT ON elements
FOR EACH ROW
EXECUTE FUNCTION set_element_order();