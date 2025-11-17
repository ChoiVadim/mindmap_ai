-- Create templates table for storing board templates
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  edges JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_templates_is_active ON templates(is_active);
CREATE INDEX IF NOT EXISTS idx_templates_created_by ON templates(created_by);
CREATE INDEX IF NOT EXISTS idx_templates_created_at ON templates(created_at DESC);

-- Enable Row Level Security
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active templates
CREATE POLICY "Anyone can read active templates"
  ON templates
  FOR SELECT
  USING (is_active = true);

-- Policy: Admins can read all templates
-- Note: This requires admin check in application code
CREATE POLICY "Admins can read all templates"
  ON templates
  FOR SELECT
  USING (true);

-- Policy: Only admins can insert templates
-- Note: This requires admin check in application code
CREATE POLICY "Admins can insert templates"
  ON templates
  FOR INSERT
  WITH CHECK (true);

-- Policy: Only admins can update templates
-- Note: This requires admin check in application code
CREATE POLICY "Admins can update templates"
  ON templates
  FOR UPDATE
  USING (true);

-- Policy: Only admins can delete templates
-- Note: This requires admin check in application code
CREATE POLICY "Admins can delete templates"
  ON templates
  FOR DELETE
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_templates_updated_at();

-- Optional: Create admin_users table for managing admins via database
-- Uncomment if you want to use database-based admin management instead of env variable
/*
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view admin_users
CREATE POLICY "Admins can view admin_users"
  ON admin_users
  FOR SELECT
  USING (true);
*/

