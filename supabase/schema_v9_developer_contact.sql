-- HACKMATE SQL MIGRATION (schema_v9_developer_contact.sql)
-- Run this in your Supabase SQL Editor to add developer contact fields and privacy settings

-- 1. Add email, phone, and public visibility settings to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS is_email_public BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_phone_public BOOLEAN DEFAULT true;

-- 2. Backfill existing profiles with email from auth.users
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');

-- 3. Backfill contact_phone from auth user metadata if previously saved
UPDATE profiles p
SET phone = u.raw_user_meta_data->>'contact_phone'
FROM auth.users u
WHERE p.id = u.id AND (p.phone IS NULL OR p.phone = '') AND u.raw_user_meta_data->>'contact_phone' IS NOT NULL;

-- 4. Backfill contact_email from auth user metadata if previously saved
UPDATE profiles p
SET email = u.raw_user_meta_data->>'contact_email'
FROM auth.users u
WHERE p.id = u.id AND u.raw_user_meta_data->>'contact_email' IS NOT NULL;

-- 5. Backfill privacy preferences from auth metadata if exists
UPDATE profiles p
SET 
  is_email_public = COALESCE((u.raw_user_meta_data->>'is_email_public')::boolean, true),
  is_phone_public = COALESCE((u.raw_user_meta_data->>'is_phone_public')::boolean, true)
FROM auth.users u
WHERE p.id = u.id;

-- 6. Trigger to automatically populate email and default privacy settings for newly registered users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email, is_email_public, is_phone_public)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Unknown User'),
    new.raw_user_meta_data->>'avatar_url',
    new.email,
    true,
    true
  )
  ON CONFLICT (id) DO UPDATE
  SET email = COALESCE(profiles.email, EXCLUDED.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Function to get developer contact info honoring privacy preferences
CREATE OR REPLACE FUNCTION get_public_developer_contact(p_username TEXT)
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
  FROM profiles
  WHERE username = p_username;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
