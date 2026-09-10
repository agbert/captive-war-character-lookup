# The Captive's War Character Archive

A Vue 3 and TypeScript character lookup for the supplied Captive's War dataset. Search by canonical name or alias, then explore identity details, book appearances, group memberships, direct and incoming relationships, events, concepts, and cross-book continuity links.

## Run locally

```bash
npm install
npm run dev
```

Open the local address printed by Vite.

## Checks

```bash
npm run test
npm run build
```

## Deploy

The deployment script builds the production bundle and synchronizes `dist/` to the web root for `captiveswar.agbert.org`:

```bash
npm run deploy
```

It connects over SSH as `agbert` and deploys to `/home/agbert/domains/captiveswar.agbert.org/public_html`. The destination is fixed in the site-specific script to prevent an accidental deployment to another remote directory.

The script uploads new generated assets before publishing `index.html`, then removes obsolete files only within the application-owned `public_html/assets/` directory. It never deletes root-level server files such as `.htaccess`, `.well-known`, or verification files. Everything inside `public_html/assets/` must belong to this application. SSH authentication must already be configured for the deployment account.

## Architecture

The app imports the source JSON without modifying it. `src/repository.ts` owns normalization, case-insensitive alias resolution, suggestions, incoming-edge discovery, lookup assembly, and reference validation. `src/App.vue` handles the small amount of interface state locally with the Vue Composition API.

The interface clearly preserves uncertain connection status and confidence. Estebán Corval and Corvall are separate records connected by an unconfirmed continuity link, and Clae's presentation remains distinct from the Swarm's `unknown` sex value.

## Dataset limitation

The source does not attach book provenance to every field. A summary, alias, or group can therefore reveal information beyond a reader's current book. This focused lookup displays a clear spoiler notice instead of claiming field-level spoiler filtering.
