import { defineConfig } from "astro/config"
import cloudflare from "astro-cloudflare-websocket"
import svelte from "@astrojs/svelte"
import { builtinModules as builtins } from "node:module"

export default defineConfig({
    adapter: cloudflare(),
    integrations: [ svelte() ],
    vite: {
        ssr: {
            external: [
                ...builtins,
                ...builtins.map(id => `node:${id}`)
            ],
        },
        server: { allowedHosts: true }
    }
})
