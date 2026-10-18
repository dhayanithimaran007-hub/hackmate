-- ==============================================================================
-- HACKMATE: COMPLETE CONSOLIDATED SUPABASE SCHEMA & MIGRATIONS
-- ==============================================================================
-- Execute this script in your Supabase SQL Editor:
--   https://supabase.com/dashboard/project/<your-project-id>/sql/new
--
-- This script is completely IDEMPOTENT (safe to run multiple times).
-- It will not delete existing user data or records.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PROFILES TABLE & COLUMNS
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
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
  username TEXT UNIQUE,
  headline TEXT,
  department TEXT,
  location TEXT,
  availability_status TEXT DEFAULT 'Open to opportunities',
  leetcode_url TEXT,
  email TEXT,
  phone TEXT,
  is_email_public BOOLEAN DEFAULT true,
  is_phone_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist if table was already created earlier
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS headline TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'Open to opportunities';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS leetcode_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_email_public BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_phone_public BOOLEAN DEFAULT true;

-- 3. HACKATHONS TABLE & COLUMNS
CREATE TABLE IF NOT EXISTS public.hackathons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
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
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.hackathons ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE public.hackathons ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- 4. APPLICATIONS TABLE & COLUMNS
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hackathon_id UUID REFERENCES public.hackathons(id) ON DELETE CASCADE NOT NULL,
  applicant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL,
  skills TEXT[],
  experience_level TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  match_score NUMERIC,
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hackathon_id, applicant_id)
);

ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- 5. HACKATHON MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.hackathon_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hackathon_id UUID REFERENCES public.hackathons(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hackathon_id, user_id)
);

-- 6. DEVELOPER PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
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

-- 7. DEVELOPER EXPERIENCE TABLE
CREATE TABLE IF NOT EXISTS public.hackathon_experience (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
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

-- 8. AUTOMATIC TIMESTAMP TRIGGER
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_hackathons_updated_at ON public.hackathons;
CREATE TRIGGER update_hackathons_updated_at BEFORE UPDATE ON public.hackathons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_applications_updated_at ON public.applications;
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_hackathon_exp_updated_at ON public.hackathon_experience;
CREATE TRIGGER update_hackathon_exp_updated_at BEFORE UPDATE ON public.hackathon_experience FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. USER SIGNUP AUTH TRIGGER & USERNAME BACKFILL
-- Backfill existing profiles with default username if null
UPDATE public.profiles
SET username = LOWER(REGEXP_REPLACE(COALESCE(full_name, 'dev'), '[^a-zA-Z0-9_-]', '', 'g')) || '_' || SUBSTRING(id::text, 1, 4)
WHERE username IS NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_name TEXT;
  v_username TEXT;
BEGIN
  v_name := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  v_username := LOWER(REGEXP_REPLACE(v_name, '[^a-zA-Z0-9_-]', '', 'g')) || '_' || SUBSTRING(new.id::text, 1, 4);

  INSERT INTO public.profiles (
    id,
    full_name,
    avatar_url,
    email,
    username,
    is_email_public,
    is_phone_public
  )
  VALUES (
    new.id,
    v_name,
    new.raw_user_meta_data->>'avatar_url',
    new.email,
    v_username,
    true,
    true
  )
  ON CONFLICT (id) DO UPDATE
  SET email = COALESCE(profiles.email, EXCLUDED.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. RPC: SECURE APPLICATION ACCEPTANCE
CREATE OR REPLACE FUNCTION public.accept_application(p_application_id UUID)
RETURNS void AS $$
DECLARE
  v_hackathon_id UUID;
  v_applicant_id UUID;
  v_organizer_id UUID;
  v_role TEXT;
  v_open_positions INTEGER;
BEGIN
  SELECT hackathon_id, applicant_id, role 
  INTO v_hackathon_id, v_applicant_id, v_role
  FROM public.applications WHERE id = p_application_id;

  SELECT organizer_id, open_positions 
  INTO v_organizer_id, v_open_positions
  FROM public.hackathons WHERE id = v_hackathon_id;

  IF v_organizer_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF v_open_positions <= 0 THEN
    RAISE EXCEPTION 'No open positions left';
  END IF;

  INSERT INTO public.hackathon_members (hackathon_id, user_id, role)
  VALUES (v_hackathon_id, v_applicant_id, v_role)
  ON CONFLICT (hackathon_id, user_id) DO NOTHING;

  UPDATE public.applications SET status = 'accepted' WHERE id = p_application_id;

  UPDATE public.hackathons 
  SET open_positions = GREATEST(0, open_positions - 1),
      team_size = team_size + 1
  WHERE id = v_hackathon_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10.1 RPC: SECURE APPLICATION WITHDRAWAL
CREATE OR REPLACE FUNCTION public.withdraw_application(p_application_id UUID)
RETURNS void AS $$
DECLARE
  v_hackathon_id UUID;
  v_applicant_id UUID;
  v_organizer_id UUID;
  v_status TEXT;
  v_max_team_size INTEGER;
BEGIN
  -- 1. Fetch application details
  SELECT hackathon_id, applicant_id, status 
  INTO v_hackathon_id, v_applicant_id, v_status
  FROM public.applications WHERE id = p_application_id;

  IF v_hackathon_id IS NULL THEN
    RAISE EXCEPTION 'Application not found';
  END IF;

  -- 2. Fetch hackathon details to verify organizer authorization
  SELECT organizer_id, max_team_size 
  INTO v_organizer_id, v_max_team_size
  FROM public.hackathons WHERE id = v_hackathon_id;

  -- 3. Authorization check: only the team owner/organizer can withdraw
  IF v_organizer_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to withdraw this applicant';
  END IF;

  -- 4. Status check
  IF v_status = 'rejected' THEN
    RAISE EXCEPTION 'Application is already rejected or withdrawn';
  END IF;

  -- 5. If previously accepted:
  IF v_status = 'accepted' THEN
    -- Remove member from hackathon_members table
    DELETE FROM public.hackathon_members 
    WHERE hackathon_id = v_hackathon_id AND user_id = v_applicant_id;

    -- Update application status to rejected
    UPDATE public.applications 
    SET status = 'rejected', updated_at = NOW() 
    WHERE id = p_application_id;

    -- Restore open positions & decrement team size in hackathons table
    UPDATE public.hackathons 
    SET open_positions = LEAST(max_team_size, open_positions + 1),
        team_size = GREATEST(1, team_size - 1),
        updated_at = NOW()
    WHERE id = v_hackathon_id;

  -- 6. If pending:
  ELSIF v_status = 'pending' THEN
    UPDATE public.applications 
    SET status = 'rejected', updated_at = NOW() 
    WHERE id = p_application_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.withdraw_application(UUID) TO authenticated, anon;

-- 11. RPC: USER CONTACT ACCESS (FOR ORGANIZERS AND ACCEPTED APPLICANTS)
CREATE OR REPLACE FUNCTION public.get_user_contact_info(p_user_id UUID)
RETURNS json AS $$
DECLARE
  v_caller_id UUID := auth.uid();
  v_is_authorized BOOLEAN := FALSE;
  v_result json;
BEGIN
  IF v_caller_id IS NULL THEN
    RETURN NULL;
  END IF;

  IF v_caller_id = p_user_id THEN
    v_is_authorized := TRUE;
  END IF;

  IF NOT v_is_authorized THEN
    IF EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.hackathons h ON a.hackathon_id = h.id
      WHERE a.applicant_id = p_user_id
        AND a.status = 'accepted'
        AND h.organizer_id = v_caller_id
    ) THEN
      v_is_authorized := TRUE;
    END IF;
  END IF;

  IF NOT v_is_authorized THEN
    IF EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.hackathons h ON a.hackathon_id = h.id
      WHERE h.organizer_id = p_user_id
        AND a.applicant_id = v_caller_id
        AND a.status = 'accepted'
    ) THEN
      v_is_authorized := TRUE;
    END IF;
  END IF;

  IF NOT v_is_authorized THEN
    RETURN NULL;
  END IF;

  SELECT json_build_object(
    'email', COALESCE(p.email, u.email),
    'phone', p.phone
  )
  INTO v_result
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE u.id = p_user_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 12. RPC: PUBLIC DEVELOPER CONTACT (HONORING PRIVACY FLAGS)
CREATE OR REPLACE FUNCTION public.get_public_developer_contact(p_username TEXT)
RETURNS json AS $$
DECLARE
  v_result json;
BEGIN
  SELECT json_build_object(
    'email', CASE WHEN is_email_public IS TRUE THEN email ELSE NULL END,
    'phone', CASE WHEN is_phone_public IS TRUE THEN phone ELSE NULL END,
    'is_email_public', is_email_public,
    'is_phone_public', is_phone_public
  )
  INTO v_result
  FROM public.profiles
  WHERE username = p_username;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 13. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathon_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathon_experience ENABLE ROW LEVEL SECURITY;

-- 14. ROW LEVEL SECURITY POLICIES
-- Profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Hackathons
DROP POLICY IF EXISTS "Anyone can view OPEN hackathons" ON public.hackathons;
CREATE POLICY "Anyone can view OPEN hackathons" ON public.hackathons FOR SELECT USING (status = 'OPEN' OR auth.uid() = organizer_id);

DROP POLICY IF EXISTS "Users can create their own hackathons" ON public.hackathons;
CREATE POLICY "Users can create their own hackathons" ON public.hackathons FOR INSERT WITH CHECK (auth.uid() = organizer_id);

DROP POLICY IF EXISTS "Users can update their own hackathons" ON public.hackathons;
CREATE POLICY "Users can update their own hackathons" ON public.hackathons FOR UPDATE USING (auth.uid() = organizer_id);

DROP POLICY IF EXISTS "Users can delete their own hackathons" ON public.hackathons;
CREATE POLICY "Users can delete their own hackathons" ON public.hackathons FOR DELETE USING (auth.uid() = organizer_id);

-- Applications
DROP POLICY IF EXISTS "Applicants can view own applications" ON public.applications;
CREATE POLICY "Applicants can view own applications" ON public.applications FOR SELECT USING (auth.uid() = applicant_id);

DROP POLICY IF EXISTS "Organizers can view applications for their hackathons" ON public.applications;
CREATE POLICY "Organizers can view applications for their hackathons" ON public.applications FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.hackathons WHERE public.hackathons.id = applications.hackathon_id AND public.hackathons.organizer_id = auth.uid())
);

DROP POLICY IF EXISTS "Applicants can create applications" ON public.applications;
CREATE POLICY "Applicants can create applications" ON public.applications FOR INSERT WITH CHECK (auth.uid() = applicant_id);

DROP POLICY IF EXISTS "Organizers can update application status" ON public.applications;
CREATE POLICY "Organizers can update application status" ON public.applications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.hackathons WHERE public.hackathons.id = applications.hackathon_id AND public.hackathons.organizer_id = auth.uid())
);

-- Members
DROP POLICY IF EXISTS "Anyone can view hackathon members" ON public.hackathon_members;
CREATE POLICY "Anyone can view hackathon members" ON public.hackathon_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "Organizers can add members" ON public.hackathon_members;
CREATE POLICY "Organizers can add members" ON public.hackathon_members FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.hackathons WHERE public.hackathons.id = hackathon_members.hackathon_id AND public.hackathons.organizer_id = auth.uid())
);

DROP POLICY IF EXISTS "Organizers can remove members" ON public.hackathon_members;
CREATE POLICY "Organizers can remove members" ON public.hackathon_members FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.hackathons WHERE public.hackathons.id = hackathon_members.hackathon_id AND public.hackathons.organizer_id = auth.uid())
);

-- Projects
DROP POLICY IF EXISTS "Anyone can view projects" ON public.projects;
CREATE POLICY "Anyone can view projects" ON public.projects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own projects" ON public.projects;
CREATE POLICY "Users can insert own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
CREATE POLICY "Users can update own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
CREATE POLICY "Users can delete own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);

-- Hackathon Experience
DROP POLICY IF EXISTS "Anyone can view hackathon experience" ON public.hackathon_experience;
CREATE POLICY "Anyone can view hackathon experience" ON public.hackathon_experience FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own hackathon experience" ON public.hackathon_experience;
CREATE POLICY "Users can insert own hackathon experience" ON public.hackathon_experience FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own hackathon experience" ON public.hackathon_experience;
CREATE POLICY "Users can update own hackathon experience" ON public.hackathon_experience FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own hackathon experience" ON public.hackathon_experience;
CREATE POLICY "Users can delete own hackathon experience" ON public.hackathon_experience FOR DELETE USING (auth.uid() = user_id);
