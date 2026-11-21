-- ============================================================
-- MIGRATION : corrections des alertes de sécurité Supabase
--             (rapport "Performance Security Lints" du 22/09/2026)
-- A exécuter dans l'éditeur SQL de Supabase (Database > SQL Editor)
-- ============================================================
--
-- Ce script corrige 3 problèmes réels de sécurité signalés par
-- l'auditeur Supabase :
--
-- 1) 14 tables ont une policy RLS nommée "service role full access"
--    avec USING(true)/WITH CHECK(true) mais SANS restriction de rôle
--    (TO service_role manquant). Résultat concret : n'importe qui muni
--    de la clé publique "anon" (visible côté client dans le site) peut
--    lire/écrire directement ces tables via l'API REST de Supabase, en
--    contournant entièrement le site et ses vérifications de rôle.
--    → on restreint chaque policy au rôle service_role uniquement
--      (celui qu'utilise le serveur du site, jamais le navigateur).
--
-- 2) La fonction is_direction(uuid) est appelable publiquement via
--    /rest/v1/rpc/is_direction — n'importe qui (même non connecté)
--    peut tester si un identifiant Supabase donné appartient à un
--    membre de la Direction.
--    → on la déplace dans un schéma "private" non exposé par l'API
--      REST, ce qui coupe l'accès direct tout en gardant son usage
--      interne dans les policies RLS de "members" (indispensable au
--      fonctionnement normal de la connexion — voir note ci-dessous).
--
-- 3) La fonction update_updated_at() (trigger interne) est elle aussi
--    appelable publiquement, sans utilité pour qui que ce soit côté
--    client.
--    → on retire simplement le droit d'exécution public ; les
--      triggers continuent de fonctionner normalement (un trigger ne
--      nécessite jamais que l'utilisateur ait le droit d'exécuter la
--      fonction directement).
--
-- ⚠️ IMPORTANT — ne pas improviser une variante de ce script sans
-- comprendre ce point : la policy "direction_read_members" ET la
-- policy "self_read_members" existent toutes les deux sur la table
-- "members" et sont combinées avec OR. Si un rôle perd le droit
-- d'exécuter is_direction(), TOUTE requête sur "members" par ce rôle
-- échoue (erreur de permission), même quand c'est "self_read_members"
-- qui aurait dû suffire — car Postgres vérifie les droits sur la
-- fonction dès l'analyse de la requête, avant tout court-circuit du
-- OR. C'est exactement ce qui a cassé la connexion au site une fois
-- déjà : ne JAMAIS retirer EXECUTE sur is_direction() au rôle
-- "authenticated". Ce script ne le fait pas — il déplace seulement la
-- fonction hors du schéma exposé par l'API REST, ce qui règle le
-- problème signalé sans toucher au droit d'exécution nécessaire.
--
-- Le 4e point du rapport ("Leaked Password Protection Disabled") ne
-- se corrige pas en SQL : Supabase Dashboard > Authentication >
-- Policies > Password Security > activer "Leaked password
-- protection". Sans incidence ici puisque le site utilise uniquement
-- la connexion Discord (aucun mot de passe), mais autant l'activer.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1) Verrouiller les policies "service role full access"
--    au rôle service_role uniquement.
-- ────────────────────────────────────────────────────────────

ALTER POLICY "service role full access" ON public.fto_attestations         TO service_role;
ALTER POLICY "service role full access" ON public.fto_bilans               TO service_role;
ALTER POLICY "service role full access" ON public.fto_evaluations          TO service_role;
ALTER POLICY "service role full access" ON public.fto_exam_results         TO service_role;
ALTER POLICY "service role full access" ON public.fto_reunions             TO service_role;
ALTER POLICY "service role full access" ON public.fto_stagiaires           TO service_role;
ALTER POLICY "service role full access" ON public.redm_caisses             TO service_role;
ALTER POLICY "service role full access" ON public.redm_cueillettes         TO service_role;
ALTER POLICY "service role full access" ON public.redm_cueillettes_archives TO service_role;
ALTER POLICY "service role full access" ON public.redm_cueilleurs          TO service_role;
ALTER POLICY "service role full access" ON public.redm_logs                TO service_role;
ALTER POLICY "service role full access" ON public.redm_presences           TO service_role;
ALTER POLICY "service role full access" ON public.redm_statistiques_hebdo  TO service_role;
ALTER POLICY "service role full access" ON public.redm_tarifs              TO service_role;

-- Vérifié dans le code du site : toutes les requêtes vers ces tables
-- "redm_*" utilisées par le dispensaire passent déjà par la clé
-- service_role côté serveur (jamais par le navigateur) — ce
-- changement ne casse donc rien côté site.
-- Les tables "fto_*" n'appartiennent pas au code de ce site ; si un
-- autre projet les utilise avec la clé "anon" ou "authenticated",
-- vérifie-le avant d'exécuter ces lignes-là spécifiquement.


-- ────────────────────────────────────────────────────────────
-- 2) Déplacer is_direction() hors du schéma exposé par l'API REST
-- ────────────────────────────────────────────────────────────

CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.is_direction(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.members
    WHERE user_id = uid
      AND status = 'approved'
      AND roles && ARRAY['dev','directeur','co_directeur','medecin_chef','medecin']::text[]
  );
$$;

-- Seul le rôle "authenticated" a besoin de l'exécuter (c'est lui qui
-- évalue les policies RLS de "members" à chaque connexion).
REVOKE ALL ON FUNCTION private.is_direction(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_direction(uuid) TO authenticated;

-- Repointer les policies existantes vers la nouvelle fonction.
DROP POLICY IF EXISTS "direction_read_members" ON public.members;
CREATE POLICY "direction_read_members" ON public.members
  FOR SELECT USING (private.is_direction(auth.uid()));

DROP POLICY IF EXISTS "direction_update_members" ON public.members;
CREATE POLICY "direction_update_members" ON public.members
  FOR UPDATE USING (private.is_direction(auth.uid()));

-- Une fois les policies repointées, l'ancienne fonction publique
-- n'est plus référencée nulle part : on peut la supprimer, ce qui
-- ferme définitivement l'accès direct via /rest/v1/rpc/is_direction.
DROP FUNCTION IF EXISTS public.is_direction(uuid);


-- ────────────────────────────────────────────────────────────
-- 3) Fermer l'accès public à la fonction de trigger update_updated_at()
-- ────────────────────────────────────────────────────────────

REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM PUBLIC, anon, authenticated;
-- Les triggers qui l'utilisent continuent de fonctionner normalement :
-- Postgres n'exige jamais que l'utilisateur ait le droit d'exécuter
-- une fonction de trigger pour que le trigger se déclenche.


-- ============================================================
-- Vérification après exécution (facultatif) :
--   SELECT policyname, roles FROM pg_policies
--   WHERE schemaname = 'public' AND policyname = 'service role full access';
--   → "roles" doit afficher {service_role} pour chaque ligne.
--
--   SELECT proname, pronamespace::regnamespace
--   FROM pg_proc WHERE proname = 'is_direction';
--   → doit afficher private.is_direction uniquement (plus de public.is_direction).
-- ============================================================
