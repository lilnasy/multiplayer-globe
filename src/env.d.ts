type Runtime<T> = import("astro-cloudflare-websocket").Runtime<T>;

declare namespace App {
    interface Locals extends Runtime<{
        VALKEY_URL?: string
        REDIS_URL?: string
    }> {}
}
