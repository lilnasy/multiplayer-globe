type Runtime<T> = import("astro-cloudflare-websocket").Runtime<T>;

declare namespace App {
    interface Locals extends Runtime<{
        VALKEY_HOST?: string
        VALKEY_PORT?: string
        VALKEY_USERNAME?: string
        VALKEY_PASSWORD?: string
        VALKEY_DB?: string
    }> {}
}
