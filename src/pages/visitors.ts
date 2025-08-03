import { createClient } from "redis"

export interface Message {
    /** The full state of the globe inclding all connected visitors. */
    globe: Record<string, Location>,
    /**
     * Self ID. Visitors are sent their own ID so their their own location
     * can be emphasized on the globe.
     */
    id: string
}

export type Location  = [
    latitude: string | number,
    longitude: string | number
]

export const prerender = false

export async function GET(api: import("astro").APIContext) {
    const { socket, response } = api.locals.upgradeWebSocket()
    const {
        cf: { latitude, longitude } = {
            latitude: Math.random() * 180 - 90,
            longitude: Math.random() * 360 - 180
        },
        env,
        ctx
    } = api.locals.runtime

    const vk = await createClient({
        url:
            env.VALKEY_URL && typeof env.VALKEY_URL === "string" ? env.VALKEY_URL
            : env.REDIS_URL && typeof env.REDIS_URL === "string" ? env.REDIS_URL
            : "redis://localhost:6379",
        RESP: 3
    }).on("error", console.error)
    .connect()

    /**
     * Non-personally identifiable visitor ID.
     * Unique to the visit, not to the user.
     */
    const visitorId = crypto.randomUUID()

    socket.onopen = async () => {
        // subscribe to mutations to visitors
        vk.subscribe(`__keyspace@${vk.options?.database ?? 0}__:visitors`, updateGlobe)

        // "visitors" holds the locations of all connected visitors
        // used to bring new visits upto speed with the current state of the globe
        vk.hSet("visitors", visitorId, JSON.stringify([ latitude, longitude ]))

        updateGlobe()
    }

    socket.onclose = () => {
        vk.unsubscribe()

        // Wait 500ms before sending the updated locations to the server
        // This to avoid sending the location of the user that just left
        ctx.waitUntil(
            new Promise((resolve, reject) =>
                setTimeout(() => vk.hDel("visitors", visitorId).then(() => vk.close()).then(resolve).catch(reject), 500)
            )
        )
    }

    async function updateGlobe() {
        const visitors = await vk.hGetAll("visitors")
        const message: Message = {
            globe: Object.fromEntries(Object.entries(visitors).map(([visitorId, location]) =>
                [ visitorId, JSON.parse(location) as Location ]
            )),
            id: visitorId
        }
        // the client may have quickly disconnected while we were waiting on the "hgetall"
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(message))
        }
    }

    return response
}
