-- ============================================
-- Migration: user_languages table
-- Per-language placement tracking (Duolingo-style)
-- ============================================

-- 1. Create the table
CREATE TABLE IF NOT EXISTS user_languages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  language_code text NOT NULL CHECK (language_code IN ('fr', 'es', 'en', 'de')),
  is_active boolean DEFAULT false,
  placement_taken boolean DEFAULT false,
  placement_level text CHECK (placement_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  placement_score integer,
  placement_taken_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, language_code)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_user_languages_user_id ON user_languages(user_id);
CREATE INDEX IF NOT EXISTS idx_user_languages_active ON user_languages(user_id, is_active) WHERE is_active = true;

-- 3. RLS
ALTER TABLE user_languages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_languages"
  ON user_languages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_languages"
  ON user_languages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_languages"
  ON user_languages FOR UPDATE
  USING (auth.uid() = user_id);

-- 4. Migrate existing data from users table into user_languages
-- Normalize slugs back to short codes
INSERT INTO user_languages (user_id, language_code, is_active, placement_taken, placement_level, placement_score, placement_taken_at)
SELECT
  id AS user_id,
  CASE learning_language
    WHEN 'french' THEN 'fr'
    WHEN 'english' THEN 'en'
    WHEN 'spanish' THEN 'es'
    WHEN 'german' THEN 'de'
    ELSE COALESCE(learning_language, 'fr')
  END AS language_code,
  true AS is_active,
  COALESCE(placement_test_taken, false) AS placement_taken,
  placement_test_level AS placement_level,
  placement_test_score AS placement_score,
  placement_test_taken_at AS placement_taken_at
FROM users
WHERE learning_language IS NOT NULL
ON CONFLICT (user_id, language_code) DO NOTHING;

-- 5. Normalize the learning_language column on users to short codes
UPDATE users SET learning_language = 'fr' WHERE learning_language = 'french';
UPDATE users SET learning_language = 'en' WHERE learning_language = 'english';
UPDATE users SET learning_language = 'es' WHERE learning_language = 'spanish';
UPDATE users SET learning_language = 'de' WHERE learning_language = 'german';
