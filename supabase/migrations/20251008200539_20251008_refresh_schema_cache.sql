/*
  # Refresh Schema Cache
  
  This is a dummy migration to force PostgREST to refresh its schema cache.
*/

NOTIFY pgrst, 'reload schema';