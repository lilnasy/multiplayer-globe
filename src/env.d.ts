type Runtime = import("astro-cloudflare-websocket").Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}
