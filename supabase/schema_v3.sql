-- HACKMATE SQL MIGRATION (schema_v3.sql)
-- Run this in your Supabase SQL Editor

-- 1. Alter profiles table to add new fields
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS headline TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'Open to opportunities',
ADD COLUMN IF NOT EXISTS leetcode_url TEXT;

-- 2. Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  technologies TEXT[],
  category TEXT,
  repository_url TEXT,
  demo_url TEXT,
  cover_image_url TEXT,
  status TEXT DEFAULT 'Completed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create hackathon_experience table
CREATE TABLE IF NOT EXISTS hackathon_experience (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  hackathon_name TEXT NOT NULL,
  event_date TEXT,
  project_title TEXT,
  role TEXT,
  achievement TEXT,
  project_url TEXT,
  verification_status TEXT DEFAULT 'Self-reported',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- UPDATE TRIGGERS FOR NEW TABLES
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hackathon_exp_updated_at ON hackathon_experience;
CREATE TRIGGER update_hackathon_exp_updated_at BEFORE UPDATE ON hackathon_experience FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS POLICIES FOR NEW TABLES
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_experience ENABLE ROW LEVEL SECURITY;

-- PROJECTS
DROP POLICY IF EXISTS "Anyone can view projects" ON projects;
CREATE POLICY "Anyone can view projects" ON projects FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
CREATE POLICY "Users can insert own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (auth.uid() = user_id);

-- HACKATHON EXPERIENCE
DROP POLICY IF EXISTS "Anyone can view hackathon experience" ON hackathon_experience;
CREATE POLICY "Anyone can view hackathon experience" ON hackathon_experience FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own hackathon experience" ON hackathon_experience;
CREATE POLICY "Users can insert own hackathon experience" ON hackathon_experience FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own hackathon experience" ON hackathon_experience;
CREATE POLICY "Users can update own hackathon experience" ON hackathon_experience FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own hackathon experience" ON hackathon_experience;
CREATE POLICY "Users can delete own hackathon experience" ON hackathon_experience FOR DELETE USING (auth.uid() = user_id);
