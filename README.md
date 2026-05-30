# Recettes

Carnet de recettes familial : import par URL ou photo (extraction IA), recherche textuelle et sémantique, chat contextuel par recette, PWA avec partage depuis le navigateur.

## Prérequis

- [Node.js](https://nodejs.org/) (LTS recommandé)
- [pnpm](https://pnpm.io/) 10.x (`packageManager` du projet : `pnpm@10.33.2`)
- Compte [OpenAI](https://platform.openai.com/) pour les fonctionnalités IA (import, chat, embeddings)

## Installation

```bash
pnpm install
```

Si Vite échoue au démarrage à cause d’esbuild, reconstruire le binaire :

```bash
pnpm rebuild esbuild
```

## Premier lancement (développement local)

### 1. Démarrer backend et frontend

```bash
pnpm dev
```

Cette commande lance `convex dev --start vite` :

| Service | URL |
|--------|-----|
| Application (Vite) | http://localhost:5173 |
| Backend Convex local | http://127.0.0.1:3210 |
| Tableau de bord Convex | http://127.0.0.1:6790/?d=anonymous-workspace |

Au **premier** `convex dev`, choisir **« Start without an account (run Convex locally) »** pour un backend anonyme local.

Le fichier `.env.local` (ignoré par git) est généré automatiquement avec `VITE_CONVEX_URL`.

### 2. Configurer l’authentification

Une fois le backend Convex actif :

```bash
pnpx @convex-dev/auth
```

Cela génère les clés JWT nécessaires à `@convex-dev/auth` (connexion par mot de passe).

### 3. Créer le compte de test

```bash
pnpm seed
```

Compte par défaut :

| Champ | Valeur |
|-------|--------|
| E-mail | `famille@recettes.local` |
| Mot de passe | `recettes123` |
| Nom affiché | Famille |

### 4. Activer l’IA (obligatoire pour import / chat / recherche sémantique)

Les variables d’environnement **Convex** (pas le fichier `.env` du frontend) :

```bash
pnpx convex env set OPENAI_API_KEY <votre-clé>
```

Vérifier les variables :

```bash
pnpx convex env list
```

## Commandes utiles

| Tâche | Commande |
|-------|----------|
| Dev (backend + frontend) | `pnpm dev` |
| Frontend seul | `pnpm dev:frontend` |
| Backend Convex seul | `pnpm dev:backend` |
| Lint | `pnpm lint` |
| Vérification TypeScript | `pnpm typecheck` |
| Build production frontend | `pnpm build` |
| Aperçu du build | `pnpm preview` |
| Format (Prettier) | `pnpm format` |
| Compte de test | `pnpm seed` |

## Configuration

### Variables d’environnement Convex

Définies avec `pnpx convex env set <NOM> <valeur>` (local) ou via le dashboard / CLI en production (`--prod`).

| Variable | Obligatoire | Description | Valeur par défaut |
|----------|-------------|-------------|-------------------|
| `OPENAI_API_KEY` | Oui (IA) | Clé API OpenAI | — |
| `OPENAI_IMPORT_MODEL` | Non | Modèle pour l’import depuis une **URL** (extraction texte HTML) | `gpt-5.4-mini` |
| `OPENAI_VISION_MODEL` | Non | Modèle pour l’import depuis des **photos** (vision) | `gpt-4.1` |
| `OPENAI_CHAT_MODEL` | Non | Modèle du **chat** contextuel sur une recette | `gpt-5.4-mini` |
| `OPENAI_EMBEDDING_MODEL` | Non | Modèle des **embeddings** (recherche sémantique) | `text-embedding-3-small` |

Exemples de surcharge :

```bash
pnpx convex env set OPENAI_CHAT_MODEL gpt-4.1-mini
pnpx convex env set OPENAI_EMBEDDING_MODEL text-embedding-3-small
```

En production :

```bash
pnpx convex env set OPENAI_API_KEY <clé> --prod
```

### Variables générées automatiquement

| Fichier / variable | Rôle |
|--------------------|------|
| `.env.local` → `VITE_CONVEX_URL` | URL du déploiement Convex pour le client React (créé par `convex dev`) |
| `CONVEX_SITE_URL` | Utilisé côté Convex pour la config auth (`convex/auth.config.ts`) |

Ne pas committer `.env.local` ni de clés API.

### Limites applicatives (code)

| Constante | Valeur | Fichier |
|-----------|--------|---------|
| Photos par recette | 8 max | `convex/lib/recipeImageLimits.ts` |
| Taille max par photo | 5 Mo | idem |
| Dimensions embedding | 1536 | `convex/lib/recipeEmbeddings.ts` (aligné sur `text-embedding-3-small`) |

### Comptes utilisateurs supplémentaires

- **Seed** : `pnpm seed` (compte famille ci-dessus).
- **Dashboard Convex** : exécuter la mutation interne `admin:createUserAccount` avec par exemple :

  ```json
  { "email": "nouveau@recettes.local", "password": "motdepasse", "name": "Nouveau" }
  ```

## Architecture

```
recettes/
├── src/                 # React 19, Vite 7, Tailwind 4, shadcn/ui (UI en français)
├── convex/              # Backend Convex (queries, mutations, actions, schéma)
│   ├── schema.ts        # Tables recipes, chat, auth
│   └── lib/             # IA, embeddings, import URL, etc.
├── public/              # Assets PWA
└── components.json      # Config shadcn/ui
```

- **Frontend** : React Router 7, `@convex-dev/auth`, thème clair/sombre, PWA (partage vers `/import`).
- **Backend** : Convex (DB temps réel, stockage fichiers, recherche full-text + vectorielle).
- **Auth** : fournisseur mot de passe (`@convex-dev/auth`).
- **IA** : OpenAI via actions Convex (`convex/lib/recipeAi.ts`, `recipeChatAi.ts`, `recipeEmbeddings.ts`).

Il n’y a pas de création manuelle de recette vide : les recettes entrent par **import URL** ou **import photo**, puis éventuelle édition dans l’interface.

## Fonctionnalités principales

- Liste et fiche recette (ingrédients, étapes, notes, tags, photos, couverture).
- Import depuis une URL de page recette (IA + téléchargement optionnel de l’image de couverture).
- Import depuis une ou plusieurs photos (jusqu’à 8, 5 Mo chacune).
- Recherche textuelle (index `searchText`) et recherche sémantique (embeddings).
- Conversations de chat par recette (historique persisté).
- PWA installable ; cible de partage `GET /import` pour préremplir l’import depuis une autre app.

## Maintenance et données

### Backfill (recherche)

Si des recettes existent sans index de recherche ou sans embedding :

```bash
pnpx convex run recipeSearch:backfillSearchText
pnpx convex run recipeSearch:backfillEmbeddings
```

(`OPENAI_API_KEY` requise pour les embeddings.)

### Développement Convex

- Guidelines API : `convex/_generated/ai/guidelines.md` (à lire avant de modifier le backend).
- Fichiers générés : `convex/_generated/` (ne pas éditer à la main ; régénérés par `convex dev`).
- Instructions agents / cloud : voir aussi [AGENTS.md](./AGENTS.md).

### Composants UI (shadcn)

```bash
pnpx shadcn@latest add <composant>
```

Les composants sont ajoutés sous `src/components/ui` selon [components.json](./components.json).

## Déploiement (aperçu)

1. Se connecter à Convex : `pnpx convex login`.
2. Configurer les variables d’environnement en production (`pnpx convex env set ... --prod`), notamment `OPENAI_API_KEY`.
3. Déployer le backend **et** builder le frontend en une commande :

```bash
pnpx convex deploy --cmd='npm run build'
```

Cette commande pousse les fonctions Convex vers la production, injecte `VITE_CONVEX_URL` pour le build, puis exécute `npm run build` (`tsc -b && vite build`). Le site statique se trouve dans `dist/`.

4. Héberger le contenu de `dist/` (Vercel, Netlify, etc.). Inutile de définir `VITE_CONVEX_URL` manuellement dans la CI si vous utilisez cette commande.

### Vercel

Le dépôt inclut un fichier [`vercel.json`](./vercel.json) à la racine. Il redirige toutes les routes vers `index.html` pour que React Router gère le routage côté client (`/import`, `/recipes/:id`, etc.) sans erreur 404 sur un rechargement direct ou un lien profond.

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Sur Vercel : connecter le repo, utiliser la même commande de build que ci-dessus (`pnpx convex deploy --cmd='npm run build'`) et le répertoire de sortie `dist`.

En développement, utiliser **`pnpx convex dev`** (ou `pnpm dev`), pas `convex deploy`, qui cible la production.

## Dépannage

| Problème | Piste |
|----------|--------|
| Erreur esbuild / Vite | `pnpm rebuild esbuild` |
| Import ou chat IA indisponible | `pnpx convex env set OPENAI_API_KEY ...` puis redémarrer `pnpm dev` |
| État local Convex perdu / incohérent | Données anonymes dans `~/.convex/anonymous-convex-backend-state/` |
| Auth / JWT | Relancer `pnpx @convex-dev/auth` après un nouveau déploiement local |
| Connexion refusée | Vérifier `pnpm seed` ou créer un compte via `admin:createUserAccount` |