-- ============================================================
-- Cabinet thérapeutique du Dispensaire de Little Creek :
-- tables et clés PROPRES à ce site (plus partagées avec la Tanière du médic).
--
-- À exécuter UNE fois dans Supabase › SQL Editor.
-- Ne supprime ni ne modifie rien : les anciennes tables restent intactes
-- (l'autre site continue de les utiliser), on en copie le contenu actuel.
-- Relançable sans risque (aucun doublon créé).
-- ============================================================

-- 1. Nouvelles tables, même structure que les anciennes
create table if not exists public.lc_cabinet_dossiers  (like public.cabinet_dossiers  including all);
create table if not exists public.lc_cabinet_documents (like public.cabinet_documents including all);

-- 2. Accès uniquement via le serveur du site (comme les autres tables)
alter table public.lc_cabinet_dossiers  enable row level security;
alter table public.lc_cabinet_documents enable row level security;

-- 3. Copie des dossiers et documents actuels
insert into public.lc_cabinet_dossiers  select * from public.cabinet_dossiers  on conflict (id) do nothing;
insert into public.lc_cabinet_documents select * from public.cabinet_documents on conflict (id) do nothing;

-- 4. Copie de l'agenda du cabinet vers une clé propre
insert into public.site_config (key, value)
select 'lc_cabinet_agenda', value from public.site_config where key = 'redm_cabinet_agenda'
on conflict (key) do nothing;

-- 5. Vérification : les deux colonnes doivent être égales
select
  (select count(*) from public.cabinet_dossiers)   as dossiers_anciens,
  (select count(*) from public.lc_cabinet_dossiers) as dossiers_nouveaux,
  (select count(*) from public.cabinet_documents)   as documents_anciens,
  (select count(*) from public.lc_cabinet_documents) as documents_nouveaux;
