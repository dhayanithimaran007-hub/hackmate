-- HACKMATE SQL MIGRATION (schema_v6_contacts.sql)
-- Run this in your Supabase SQL Editor to enable secure contact sharing

CREATE OR REPLACE FUNCTION get_user_contact_info(p_user_id UUID)
RETURNS json AS $$
DECLARE
  v_caller_id UUID := auth.uid();
  v_is_authorized BOOLEAN := FALSE;
  v_result json;
BEGIN
  IF v_caller_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- 1. Check if asking for self
  IF v_caller_id = p_user_id THEN
    v_is_authorized := TRUE;
  END IF;

  -- 2. Check if caller is organizer of a hackathon where p_user_id is accepted
  IF NOT v_is_authorized THEN
    IF EXISTS (
      SELECT 1 FROM applications a
      JOIN hackathons h ON a.hackathon_id = h.id
      WHERE a.applicant_id = p_user_id
        AND a.status = 'accepted'
        AND h.organizer_id = v_caller_id
    ) THEN
      v_is_authorized := TRUE;
    END IF;
  END IF;

  -- 3. Check if caller is accepted applicant of a hackathon organized by p_user_id
  IF NOT v_is_authorized THEN
    IF EXISTS (
      SELECT 1 FROM applications a
      JOIN hackathons h ON a.hackathon_id = h.id
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
    'email', COALESCE(raw_user_meta_data->>'contact_email', email),
    'phone', raw_user_meta_data->>'contact_phone'
  )
  INTO v_result
  FROM auth.users
  WHERE id = p_user_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
