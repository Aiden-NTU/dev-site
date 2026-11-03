CREATE TABLE IF NOT EXISTS page_hits (
  id TEXT PRIMARY KEY NOT NULL,
  path TEXT NOT NULL,
  title TEXT,
  project_id TEXT,
  country TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_page_hits_created ON page_hits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_hits_project ON page_hits(project_id);
CREATE INDEX IF NOT EXISTS idx_page_hits_country ON page_hits(country);

CREATE TABLE IF NOT EXISTS project_views (
  project_id TEXT PRIMARY KEY NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);
