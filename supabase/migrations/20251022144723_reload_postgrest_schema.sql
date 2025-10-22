/*
  # Reload PostgREST Schema Cache
  
  Forces PostgREST to reload its schema cache to recognize newly created tables.
  This uses multiple methods to ensure the cache is refreshed.
*/

-- Method 1: Send NOTIFY signal
NOTIFY pgrst, 'reload schema';

-- Method 2: Update a system catalog to trigger cache invalidation
COMMENT ON TABLE user_privacy_settings IS 'User privacy and profile visibility settings';

-- Method 3: Grant explicit permissions (sometimes helps with cache)
GRANT ALL ON user_privacy_settings TO authenticated;
GRANT ALL ON user_privacy_settings TO service_role;
