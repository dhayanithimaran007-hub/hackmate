-- ==============================================================================
-- SCHEMA MIGRATION V10: WITHDRAW APPLICATION RPC
-- Enables organizers to safely withdraw/revoke an applicant's acceptance or pending request,
-- removing them from hackathon_members and restoring open_positions / team_size counters.
-- ==============================================================================

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
