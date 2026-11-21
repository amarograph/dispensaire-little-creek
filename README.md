# Dispensaire de Little Creek

Site interne du dispensaire (RedM) : registre des caisses, comptabilité, stock, bibliothèque, agenda, cabinet thérapeutique, obstétrique, évènements et espace Direction.

**Stack** : Next.js 14 (App Router, TypeScript) · Supabase (auth Discord + base) · déploiement Vercel.

## Démarrer en local

```bash
npm install
cp .env.example .env.local   # puis remplir les valeurs
npm run dev
```

Vérification avant de publier :

```bash
npm run typecheck   # doit afficher 0 erreur
npm run build
```

## Variables d'environnement

Voir `.env.example`. `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET` et les webhooks Discord sont **secrets** : ne jamais les mettre dans le code ni dans une capture. Si l'un d'eux fuite, le régénérer (Supabase / Discord) puis mettre à jour Vercel.

## Déploiement

```bash
git push deploy main
```

## Organisation du code

| Dossier | Contenu |
|---|---|
| `app/redm/` | Pages du dispensaire (accueil, comptabilité, direction, cabinet, obstétrique…) |
| `app/api/` | Routes serveur : `api/redm/*` (personnel), `api/admin/*` (Direction), `api/cron/*` (tâches planifiées) |
| `app/admin/` | Gestion des accès (whitelist) et tableau de bord développeur |
| `lib/permissions.ts` | Rôles et accès par section |
| `lib/supabase/middleware.ts` | Connexion obligatoire, validation du compte, contrôle d'accès par route |
| `lib/redm-api-auth.ts` | Contrôle des rôles dans les API |
| `lib/redm-log.ts` | Journal des actions (Direction › Journal) |
| `docs/sql/` | Schéma et migrations Supabase, à exécuter dans l'éditeur SQL |
| `public/icones/`, `public/logo-*.webp` | Icônes et logos |

## Où sont stockées les données

- Tables dédiées : membres, tarifs (`redm_tarifs`), journal (`redm_logs`)…
- Le reste (factures, archives, agenda, roues, évènements, stock, bibliothèque, réductions…) est stocké en JSON dans la table `site_config`, une clé par domaine. Chaque enregistrement lit puis réécrit le bloc complet : deux enregistrements simultanés sur la même clé peuvent s'écraser.

## Tâches planifiées

`/api/cron/rdv-rappels` envoie les rappels de rendez-vous sur Discord. Elle exige `CRON_SECRET`.
