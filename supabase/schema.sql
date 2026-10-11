-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to automatically create a profile when a new user registers
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

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- REQUIREMENTS
CREATE TABLE requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  budget NUMERIC NOT NULL,
  deadline TIMESTAMPTZ NOT NULL,
  skills TEXT[],
  preferences TEXT,
  status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED', 'SELECTED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- OFFERS
CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requirement_id UUID REFERENCES requirements(id) NOT NULL,
  provider_id UUID REFERENCES profiles(id) NOT NULL,
  price NUMERIC NOT NULL,
  delivery_days INTEGER NOT NULL,
  proposal TEXT NOT NULL,
  experience TEXT,
  status TEXT DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'SHORTLISTED', 'SELECTED', 'REJECTED')),
  relevance_score NUMERIC,
  budget_score NUMERIC,
  delivery_score NUMERIC,
  match_score NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requirement_id, provider_id)
);

-- SHORTLISTS
CREATE TABLE shortlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requirement_id UUID REFERENCES requirements(id) NOT NULL,
  offer_id UUID REFERENCES offers(id) NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, requirement_id, offer_id)
);

-- SELECTIONS
CREATE TABLE selections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requirement_id UUID REFERENCES requirements(id) NOT NULL,
  offer_id UUID REFERENCES offers(id) NOT NULL,
  selected_by UUID REFERENCES profiles(id) NOT NULL,
  selected_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requirement_id)
);

-- UPDATE TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requirements_updated_at
    BEFORE UPDATE ON requirements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offers_updated_at
    BEFORE UPDATE ON offers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shortlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE selections ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- REQUIREMENTS POLICIES
CREATE POLICY "Anyone can view OPEN requirements" ON requirements FOR SELECT USING (status = 'OPEN' OR auth.uid() = user_id);
CREATE POLICY "Users can create their own requirements" ON requirements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own requirements" ON requirements FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own requirements" ON requirements FOR DELETE USING (auth.uid() = user_id);

-- OFFERS POLICIES
CREATE POLICY "Providers can view own offers" ON offers FOR SELECT USING (auth.uid() = provider_id);
CREATE POLICY "Requirement owners can view offers for their requirements" ON offers FOR SELECT USING (
  EXISTS (SELECT 1 FROM requirements WHERE requirements.id = offers.requirement_id AND requirements.user_id = auth.uid())
);
CREATE POLICY "Providers can create offers" ON offers FOR INSERT WITH CHECK (auth.uid() = provider_id);

-- SHORTLISTS POLICIES
CREATE POLICY "Users can view their own shortlists" ON shortlists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own shortlists" ON shortlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own shortlists" ON shortlists FOR DELETE USING (auth.uid() = user_id);

-- SELECTIONS POLICIES
CREATE POLICY "Anyone can view selections" ON selections FOR SELECT USING (true);
CREATE POLICY "Requirement owner can select offer" ON selections FOR INSERT WITH CHECK (
  auth.uid() = selected_by AND
  EXISTS (SELECT 1 FROM requirements WHERE requirements.id = selections.requirement_id AND requirements.user_id = auth.uid())
);

-- RPC for secure offer selection
CREATE OR REPLACE FUNCTION select_offer(
  p_requirement_id UUID,
  p_offer_id UUID
)
RETURNS void AS $$
DECLARE
  v_owner_id UUID;
  v_req_status TEXT;
BEGIN
  -- Verify ownership and requirement status
  SELECT user_id, status INTO v_owner_id, v_req_status 
  FROM requirements 
  WHERE id = p_requirement_id;

  IF v_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF v_req_status != 'OPEN' THEN
    RAISE EXCEPTION 'Requirement is not OPEN';
  END IF;

  -- Verify offer belongs to requirement
  IF NOT EXISTS (SELECT 1 FROM offers WHERE id = p_offer_id AND requirement_id = p_requirement_id) THEN
    RAISE EXCEPTION 'Offer does not belong to this requirement';
  END IF;

  -- Create selection
  INSERT INTO selections (requirement_id, offer_id, selected_by)
  VALUES (p_requirement_id, p_offer_id, auth.uid());

  -- Update requirement status
  UPDATE requirements SET status = 'SELECTED' WHERE id = p_requirement_id;

  -- Update selected offer
  UPDATE offers SET status = 'SELECTED' WHERE id = p_offer_id;

  -- Update other offers to REJECTED
  UPDATE offers SET status = 'REJECTED' WHERE requirement_id = p_requirement_id AND id != p_offer_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
