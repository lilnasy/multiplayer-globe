import { defineConfig } from "astro/config"
import cloudflare from "astro-cloudflare-websocket";
import svelte from "@astrojs/svelte"
import { builtinModules as builtins } from "node:module"

export default defineConfig({
    adapter: cloudflare({
        platformProxy: {
            enabled: true,
            configPath: "./wrangler.json",
        }
    }),
    integrations: [
        svelte(),
    ],
    vite: {
        plugins: [{
            // cloudflare adapter breaks when using node built in node modules
            // even if they are supported by cloudflare workers
            // https://stackblitz.com/edit/github-oqgbvn?file=astro.config.mjs
            name: "resolve-node-built-in-modules",
            enforce: "pre",
            resolveId(id) {
                if (id[0] === '.' || id[0] === '/') return;
                if (builtins.includes(id)) {
                    return { id: `node:${id}`, external: id === "tls" ? false :true };
                }
            },
            load(id) {
                // node:tls is not yet supported by cloudflare workers
                // ioredis imports it but only uses it when the client asks for tls, which we dont
                if (id === "node:tls") {
                    return `export default undefined`
                }
            }
        }],
        esbuild: {
            tsconfigRaw: {
                compilerOptions: {
                    // make the compilation of classes
                    // compatable with standard ES6
                    useDefineForClassFields: true,
                },
            }
        },
        ssr: {
            external: [...builtins.map(id => `node:${id}`)],
        },
        server: {
            allowedHosts: true,
        }
    }
})
