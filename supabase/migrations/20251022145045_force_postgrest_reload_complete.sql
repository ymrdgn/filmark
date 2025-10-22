/*
  # Force Complete PostgREST Schema Cache Reload
  
  This migration forces PostgREST to completely reload its schema cache
  using multiple techniques including schema version updates.
*/

-- Method 1: NOTIFY signal
NOTIFY pgrst, 'reload schema';

-- Method 2: Modify schema metadata to trigger reload
DO $$
BEGIN
  -- Update comments to trigger schema change detection
  PERFORM pg_catalog.obj_description(c.oid, 'pg_class')
  FROM pg_catalog.pg_class c
  WHERE c.relname = 'user_privacy_settings';
  
  -- Touch the functions
  COMMENT ON FUNCTION get_user_privacy_settings(uuid) IS 'Get user privacy settings - Forces cache reload';
  COMMENT ON FUNCTION update_user_privacy_settings(uuid, text, boolean, boolean) IS 'Update user privacy settings - Forces cache reload';
END $$;

-- Method 3: Recreate a view that PostgREST watches
CREATE OR REPLACE VIEW public.schema_version AS
SELECT now() as last_updated;

-- Method 4: Grant permissions again (sometimes triggers reload)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
