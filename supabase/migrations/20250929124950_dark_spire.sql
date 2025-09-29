@@ .. @@
 -- Create trigger to update updated_at column
-CREATE TRIGGER IF NOT EXISTS update_friends_updated_at
+CREATE OR REPLACE FUNCTION update_updated_at_column()
+RETURNS TRIGGER AS $$
+BEGIN
+    NEW.updated_at = CURRENT_TIMESTAMP;
+    RETURN NEW;
+END;
+$$ language 'plpgsql';
+
+-- Create trigger for friends table (if not exists)
+DO $$
+BEGIN
+    IF NOT EXISTS (
+        SELECT 1 FROM pg_trigger 
+        WHERE tgname = 'update_friends_updated_at'
+    ) THEN
+        CREATE TRIGGER update_friends_updated_at
+            BEFORE UPDATE ON friends
+            FOR EACH ROW
+            EXECUTE FUNCTION update_updated_at_column();
+    END IF;
+END $$;