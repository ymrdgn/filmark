-- Create app_version table to store minimum required version
CREATE TABLE IF NOT EXISTS app_version (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
    minimum_version TEXT NOT NULL,
    current_version TEXT NOT NULL,
    force_update BOOLEAN DEFAULT false,
    update_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique constraint on platform
CREATE UNIQUE INDEX IF NOT EXISTS app_version_platform_idx ON app_version(platform);

-- Enable RLS
ALTER TABLE app_version ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read version info
CREATE POLICY "Anyone can read app version" ON app_version
    FOR SELECT
    USING (true);

-- Insert initial version data
INSERT INTO app_version (platform, minimum_version, current_version, force_update, update_message)
VALUES 
    ('ios', '1.0.26', '1.0.26', false, 'New features and improvements are available. Please update the app.'),
    ('android', '1.0.26', '1.0.26', false, 'New features and improvements are available. Please update the app.')
ON CONFLICT (platform) DO NOTHING;
