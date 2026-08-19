
-- 1. Reviewer assignments: restrict deletes
DROP POLICY IF EXISTS "Reviewer assignments: members delete" ON public.asset_reviewer_assignments;
CREATE POLICY "Reviewer assignments: assigner or admin delete"
ON public.asset_reviewer_assignments
FOR DELETE
USING (
  is_org_member(org_id)
  AND (assigned_by = auth.uid() OR has_org_role_any(org_id, ARRAY['owner'::org_role, 'admin'::org_role]))
);

-- 2. Reviews: only assigned reviewers (or admins) may submit
DROP POLICY IF EXISTS "Reviews: members insert" ON public.asset_reviews;
CREATE POLICY "Reviews: assigned reviewer insert"
ON public.asset_reviews
FOR INSERT
WITH CHECK (
  is_org_member(org_id)
  AND reviewer_id = auth.uid()
  AND (
    EXISTS (
      SELECT 1 FROM public.asset_reviewer_assignments a
      WHERE a.asset_id = asset_reviews.asset_id
        AND a.reviewer_id = auth.uid()
        AND a.org_id = asset_reviews.org_id
    )
    OR has_org_role_any(org_id, ARRAY['owner'::org_role, 'admin'::org_role])
  )
);

-- 3. Integration status: only admins/owners or the marker may update/delete
DROP POLICY IF EXISTS "IntStatus: members update" ON public.org_integration_status;
CREATE POLICY "IntStatus: admin or marker update"
ON public.org_integration_status
FOR UPDATE
USING (
  is_org_member(org_id)
  AND (marked_by = auth.uid() OR has_org_role_any(org_id, ARRAY['owner'::org_role, 'admin'::org_role]))
)
WITH CHECK (
  is_org_member(org_id)
  AND (marked_by = auth.uid() OR has_org_role_any(org_id, ARRAY['owner'::org_role, 'admin'::org_role]))
);

DROP POLICY IF EXISTS "IntStatus: members delete" ON public.org_integration_status;
CREATE POLICY "IntStatus: admin or marker delete"
ON public.org_integration_status
FOR DELETE
USING (
  is_org_member(org_id)
  AND (marked_by = auth.uid() OR has_org_role_any(org_id, ARRAY['owner'::org_role, 'admin'::org_role]))
);

-- 4. Lock down SECURITY DEFINER functions that app users must not call directly.
-- Trigger functions
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mirror_campaign_request_to_contact() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mirror_lead_referral_to_contact() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.seed_org_campaign_stages() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.seed_org_campaign_types() FROM PUBLIC, anon, authenticated;

-- Server-only routines (service_role / server runtime)
REVOKE ALL ON FUNCTION public.get_cron_secret() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.seed_contacts_sample(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.seed_funnel_sample(uuid, uuid) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_cron_secret() TO service_role;
GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.seed_contacts_sample(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.seed_funnel_sample(uuid, uuid) TO service_role;

-- Signed-in-only routines: not callable anonymously
REVOKE ALL ON FUNCTION public.accept_org_invite(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_org_invite(text) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.get_org_invite_token(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_org_invite_token(uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.dispatch_hmac(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dispatch_hmac(uuid, text) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.record_ai_call(text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_ai_call(text, integer) TO authenticated, service_role;
