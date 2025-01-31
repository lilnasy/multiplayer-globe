# Multiplayer Globe App with Astro
Display website visitor locations in real-time using Cloudflare and Redis.

<p align=center>
  <a href="https://multiplayer-globe.pages.dev">See it live at multiplayer-globe.pages.dev</a> | <a href="https://github.com/codespaces/new?skip_quickstart=true&repo=923929205&ref=main&machine=premiumLinux">Start hacking on it in a dev container</a>
</p>

![Screenshot](https://github.com/user-attachments/assets/501eb849-b6cc-459d-a243-38de64776463)

## Credits

Inspired by <a href="https://github.com/cloudflare/templates/tree/main/multiplayer-globe-template">Cloudflare's multiplayer-globe-template</a> and the <a href="https://github.com/nuxt-hub/multiplayer-globe">NuxtHub implementation</a>.

## Features
🪶**Lightweight**: production build ships just 16.7kb of JS, including the WebGL renderer, svelte runtime, and realtime communication.

## How it works
A `/visitors` websocket endpoint is created in the [src/pages/visitors.ts](./src/pages/visitors.ts) file.
The endpoint uses `locals.upgradeWebSocket()` provided by the `astro-cloudflare-websocket` adapter.

When the [app.svelte](./src/components/app.svelte) component is loaded on the browser, it connects to the `/visitors` websocket endpoint.
The endpoint uses the visitor location provided by Cloudflare and aggregates it in a ValKey (open source Redis) server.

Everytime a location is added or removed, the ValKey server broadcasts an event to all connected workers, acting as the single point of coordination.
Each worker then forwards the locations of currently connected visitors to its connected browser over the websocket connection.

## Setup
Make sure to install the dependencies with [pnpm](https://pnpm.io/installation#using-corepack):
```bash
pnpm install
```
Start a valkey server with the following command:
```bash
docker run --rm -p 6379:6379 valkey/valkey:8.0.2-alpine3.21
```
If the valkey server is not running on the same device as the development server, you can provide the options as the following variables in `.dev.vars` (see [Local Development with Secrets | Cloudflare Docs](https://developers.cloudflare.com/workers/configuration/secrets/#local-development-with-secrets)):
```bash
VALKEY_HOST=db.local
VALKEY_PORT=6379
VALKEY_USERNAME=multiplayer-app
VALKEY_PASSWORD=multiplayer_password
VALKEY_DB=0
```
See [Secrets on deployed Workers | Cloudflare Docs](https://developers.cloudflare.com/workers/configuration/secrets/#secrets-on-deployed-workers) for information on setting up secrets for the production environment.

## Development Server
Start the development server on `http://localhost:4321`:
```bash
pnpm dev
```

## Previewing Locally
The production code runs on Cloudflare's `workerd` runtime instead of Node.js. You can preview the website realistically with `wrangler` which can run the production build locally.
```bash
pnpm exec astro build
pnpm exec wrangler pages dev
```

## Deploying to Cloudflare Network
```bash
pnpm exec astro build
pnpm exec wrangler pages deploy
```
