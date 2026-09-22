-- ============================================================
-- CORRECTIF URGENT — à exécuter immédiatement après
-- migration_security_lints_2026-09-22.sql
-- ============================================================
--
-- Le script précédent créait le schéma "private" et accordait EXECUTE
-- sur private.is_direction() au rôle "authenticated", mais oubliait
-- d'accorder l'accès au schéma lui-même (USAGE). Sans ce droit,
-- Postgres refuse même de résoudre "private.is_direction" pour ce
-- rôle, ce qui peut faire échouer des vérifications de connexion
-- utilisant la table "members".
--
-- Ce correctif est purement additif (il n'enlève aucun droit) —
-- sûr à exécuter immédiatement.
-- ============================================================

GRANT USAGE ON SCHEMA private TO authenticated;

-- Vérification (facultatif) :
--   SELECT has_schema_privilege('authenticated', 'private', 'USAGE');
--   → doit renvoyer "true"
