import { defineConfig } from "astro/config"
import cloudflare from "astro-cloudflare-websocket";
import svelte from "@astrojs/svelte"
import { builtinModules as builtins } from "node:module"

export default defineConfig({
    adapter: cloudflare(),
    integrations: [ svelte() ],
    vite: {
        // node:tls is not yet supported by cloudflare workers
        // ioredis imports it but only uses it when the client asks for tls, which we dont
        plugins: [{
            name: "noop-tls",
            enforce: "pre",
            resolveId(id) {
                if (id === "tls") {
                    return id
                }
            },
            load(id) {
                if (id === "tls") {
                    return `export default undefined`
                }
            }
        }],
        ssr: {
            external: [
                ...builtins,
                ...builtins.map(id => `node:${id}`)
            ],
        },
        server: { allowedHosts: true }
    }
})
