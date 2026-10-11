-- HACKMATE SQL MIGRATION (schema_v2.sql)
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES (Users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  college TEXT,
  study_year TEXT,
  skills TEXT[],
  preferred_roles TEXT[],
  experience_level TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  available_for_hackathons BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Unknown User'),
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- HACKATHONS
CREATE TABLE IF NOT EXISTS hackathons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  hackathon_url TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  registration_deadline TIMESTAMPTZ NOT NULL,
  location TEXT,
  mode TEXT NOT NULL CHECK (mode IN ('Online', 'Offline', 'Hybrid')),
  team_size INTEGER DEFAULT 1,
  max_team_size INTEGER NOT NULL,
  open_positions INTEGER NOT NULL,
  experience_level TEXT NOT NULL,
  skills TEXT[],
  required_roles TEXT[],
  status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- APPLICATIONS
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hackathon_id UUID REFERENCES hackathons(id) NOT NULL,
  applicant_id UUID REFERENCES profiles(id) NOT NULL,
  role TEXT NOT NULL,
  skills TEXT[],
  experience_level TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  match_score NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hackathon_id, applicant_id)
);

-- HACKATHON MEMBERS (Team)
CREATE TABLE IF NOT EXISTS hackathon_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hackathon_id UUID REFERENCES hackathons(id) NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  role TEXT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hackathon_id, user_id)
);

-- UPDATE TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hackathons_updated_at ON hackathons;
CREATE TRIGGER update_hackathons_updated_at BEFORE UPDATE ON hackathons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_applications_updated_at ON applications;
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathons ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_members ENABLE ROW LEVEL SECURITY;

-- PROFILES
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- HACKATHONS
DROP POLICY IF EXISTS "Anyone can view OPEN hackathons" ON hackathons;
CREATE POLICY "Anyone can view OPEN hackathons" ON hackathons FOR SELECT USING (status = 'OPEN' OR auth.uid() = organizer_id);
DROP POLICY IF EXISTS "Users can create their own hackathons" ON hackathons;
CREATE POLICY "Users can create their own hackathons" ON hackathons FOR INSERT WITH CHECK (auth.uid() = organizer_id);
DROP POLICY IF EXISTS "Users can update their own hackathons" ON hackathons;
CREATE POLICY "Users can update their own hackathons" ON hackathons FOR UPDATE USING (auth.uid() = organizer_id);
DROP POLICY IF EXISTS "Users can delete their own hackathons" ON hackathons;
CREATE POLICY "Users can delete their own hackathons" ON hackathons FOR DELETE USING (auth.uid() = organizer_id);

-- APPLICATIONS
DROP POLICY IF EXISTS "Applicants can view own applications" ON applications;
CREATE POLICY "Applicants can view own applications" ON applications FOR SELECT USING (auth.uid() = applicant_id);
DROP POLICY IF EXISTS "Organizers can view applications for their hackathons" ON applications;
CREATE POLICY "Organizers can view applications for their hackathons" ON applications FOR SELECT USING (
  EXISTS (SELECT 1 FROM hackathons WHERE hackathons.id = applications.hackathon_id AND hackathons.organizer_id = auth.uid())
);
DROP POLICY IF EXISTS "Applicants can create applications" ON applications;
CREATE POLICY "Applicants can create applications" ON applications FOR INSERT WITH CHECK (auth.uid() = applicant_id);
DROP POLICY IF EXISTS "Organizers can update application status" ON applications;
CREATE POLICY "Organizers can update application status" ON applications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM hackathons WHERE hackathons.id = applications.hackathon_id AND hackathons.organizer_id = auth.uid())
);

-- MEMBERS
DROP POLICY IF EXISTS "Anyone can view hackathon members" ON hackathon_members;
CREATE POLICY "Anyone can view hackathon members" ON hackathon_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Organizers can add members" ON hackathon_members;
CREATE POLICY "Organizers can add members" ON hackathon_members FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM hackathons WHERE hackathons.id = hackathon_members.hackathon_id AND hackathons.organizer_id = auth.uid())
);
DROP POLICY IF EXISTS "Organizers can remove members" ON hackathon_members;
CREATE POLICY "Organizers can remove members" ON hackathon_members FOR DELETE USING (
  EXISTS (SELECT 1 FROM hackathons WHERE hackathons.id = hackathon_members.hackathon_id AND hackathons.organizer_id = auth.uid())
);

-- RPC for application acceptance
CREATE OR REPLACE FUNCTION accept_application(
  p_application_id UUID
)
RETURNS void AS $$
DECLARE
  v_hackathon_id UUID;
  v_applicant_id UUID;
  v_organizer_id UUID;
  v_role TEXT;
  v_open_positions INTEGER;
BEGIN
  -- Get application details
  SELECT hackathon_id, applicant_id, role 
  INTO v_hackathon_id, v_applicant_id, v_role
  FROM applications WHERE id = p_application_id;

  -- Verify organizer
  SELECT organizer_id, open_positions 
  INTO v_organizer_id, v_open_positions
  FROM hackathons WHERE id = v_hackathon_id;

  IF v_organizer_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF v_open_positions <= 0 THEN
    RAISE EXCEPTION 'No open positions left';
  END IF;

  -- Add to members
  INSERT INTO hackathon_members (hackathon_id, user_id, role)
  VALUES (v_hackathon_id, v_applicant_id, v_role);

  -- Update application status
  UPDATE applications SET status = 'accepted' WHERE id = p_application_id;

  -- Update hackathon stats
  UPDATE hackathons 
  SET open_positions = open_positions - 1,
      team_size = team_size + 1
  WHERE id = v_hackathon_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
