-- ============================================================
-- MIGRATION: Connexion Discord + validation par la direction + rôles
-- A exécuter dans l'éditeur SQL de Supabase (Database > SQL Editor)
-- ============================================================

-- ============================================================
-- TABLE: members
-- Stocke uniquement le strict nécessaire : pseudo + ID Discord
-- + statut de validation + rôles. Rien d'autre (pas d'email, pas d'avatar).
--
-- Rôles possibles (voir lib/permissions.ts) :
--   dev, directeur, co_directeur, medecin_chef, medecin,
--   apprenti_medecin, infirmier, preparateur_caisse, therapeute
-- Un membre peut avoir plusieurs rôles à la fois.
-- ============================================================
CREATE TABLE members (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  discord_id TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  roles TEXT[] NOT NULL DEFAULT '{}',
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  decided_at TIMESTAMPTZ,
  decided_by TEXT
);

ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Chacun peut lire sa propre fiche (pour connaître son statut/ses rôles)
CREATE POLICY "self_read_members" ON members
  FOR SELECT USING (auth.uid() = user_id);

-- Chacun peut créer sa propre fiche lors de sa première connexion
CREATE POLICY "self_insert_members" ON members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- La direction (rôle avec permission "direction" : dev, directeur,
-- co_directeur, medecin_chef, medecin) peut tout lire
CREATE POLICY "direction_read_members" ON members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM members d
      WHERE d.user_id = auth.uid()
        AND d.status = 'approved'
        AND d.roles && ARRAY['dev','directeur','co_directeur','medecin_chef','medecin']::text[]
    )
  );

-- La direction peut valider / refuser / attribuer des rôles
CREATE POLICY "direction_update_members" ON members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM members d
      WHERE d.user_id = auth.uid()
        AND d.status = 'approved'
        AND d.roles && ARRAY['dev','directeur','co_directeur','medecin_chef','medecin']::text[]
    )
  );

CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_roles ON members USING GIN (roles);
