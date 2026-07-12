-- ============================================
-- Migration: game_scores + per-game/theme leaderboard
-- Stores a row per finished mini-game so we can rank players by their best
-- score for each (game type, theme, language).
-- ============================================

-- 1. Table
CREATE TABLE IF NOT EXISTS game_scores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game text NOT NULL,                 -- e.g. 'maze-chase', 'memory-match'
  theme text NOT NULL,                -- e.g. 'animals', 'food'
  language text NOT NULL,             -- route slug: 'french', 'spanish', ...
  score integer NOT NULL DEFAULT 0,
  level_reached integer,
  won boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 2. Indexes (leaderboard reads by game+theme+language ordered by score)
CREATE INDEX IF NOT EXISTS idx_game_scores_board ON game_scores(game, theme, language, score DESC);
CREATE INDEX IF NOT EXISTS idx_game_scores_user ON game_scores(user_id);

-- 3. RLS — players write and read their own rows; the public board comes from
--    the SECURITY DEFINER function below (which safely joins to users.name).
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_insert_own_scores"
  ON game_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_read_own_scores"
  ON game_scores FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Leaderboard function: best score per player for a given game/theme/language.
CREATE OR REPLACE FUNCTION game_leaderboard(
  p_game text,
  p_theme text,
  p_language text,
  p_limit integer DEFAULT 20
)
RETURNS TABLE (
  user_id uuid,
  name text,
  avatar_url text,
  best_score integer,
  plays integer,
  last_played timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    gs.user_id,
    COALESCE(NULLIF(u.name, ''), 'Player') AS name,
    u.avatar_url,
    MAX(gs.score)::integer AS best_score,
    COUNT(*)::integer AS plays,
    MAX(gs.created_at) AS last_played
  FROM game_scores gs
  JOIN users u ON u.id = gs.user_id
  WHERE gs.game = p_game AND gs.theme = p_theme AND gs.language = p_language
  GROUP BY gs.user_id, u.name, u.avatar_url
  ORDER BY best_score DESC, last_played ASC
  LIMIT GREATEST(1, LEAST(p_limit, 100));
$$;

GRANT EXECUTE ON FUNCTION game_leaderboard(text, text, text, integer) TO anon, authenticated;
