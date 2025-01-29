# Multiplayer Globe App with Astro
Display website visitor locations in real-time using Cloudflare and Redis.

<p align=center>
  <a href="https://multiplayer-globe.pages.dev">See it live at multiplayer-globe.pages.dev</a> | <a href="https://github.com/codespaces/new?skip_quickstart=true&repo=923929205&ref=main&machine=premiumLinux">Start hacking on it in a dev container</a>
</p>

![Screenshot](https://github.com/user-attachments/assets/501eb849-b6cc-459d-a243-38de64776463)

## Credits

Inspired by <a href="https://github.com/cloudflare/templates/tree/main/multiplayer-globe-template">Cloudflare's multiplayer-globe-template</a> and the <a href="https://github.com/nuxt-hub/multiplayer-globe">NuxtHub implementation</a>.

## Lightweight

Production build ships just 16.7kb of JS, including the WebGL renderer, svelte runtime, and realtime communication.

## Setup
Make sure to install the dependencies with [pnpm](https://pnpm.io/installation#using-corepack):
```bash
pnpm install
```
Start a valkey server with the following command:
```bash
docker run --rm -p 6379:6379 valkey/valkey:8.0.2-alpine3.21
```
If the valkey server is not running on the same device as the development server, you can provide the options as the following environment variables:
```bash
VALKEY_HOST=db.local
VALKEY_PORT=6379
VALKEY_USERNAME=multiplayer-app
VALKEY_PASSWORD=multiplayer_password
VALKEY_DB=0
```
These variables are read during the build process which injects them into the server bundle.
Providing them during runtime is not necessary, and will have no effect on the application.

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
