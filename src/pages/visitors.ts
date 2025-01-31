import Valkey, { type RedisOptions } from "iovalkey"

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

export function GET(api: import('astro').APIContext) {
    const { socket, response } = api.locals.upgradeWebSocket()
    const {
        cf: { latitude, longitude } = {
            latitude: Math.random() * 180 - 90,
            longitude: Math.random() * 360 - 180
        },
        env,
        ctx
    } = api.locals.runtime

    /**
     * If these environment variables are not set, the default
     * values will be used, and the server will attempt to
     * connect to the locally running valkey server on port 6379.
     */
    const vkOptions = {
        host:     env.VALKEY_HOST,
        port:     env.VALKEY_PORT as unknown as number | undefined,
        username: env.VALKEY_USERNAME,
        password: env.VALKEY_PASSWORD,
        db:       env.VALKEY_DB as unknown as number | undefined
    } satisfies RedisOptions

    const vk = new Valkey(vkOptions)

    // pubsub requires a dedicated connection
    // unless the redis client is using resp3,
    // which is not supported by iovalkey yet
    const pubsub = new Valkey(vkOptions)
    pubsub.on("message", updateGlobe)

    /**
     * Non-personally identifiable visitor ID.
     * Unique to the visit, not to the user.
     */
    const visitorId = crypto.randomUUID()

    socket.onopen = async () => {
        // subscribe to mutations to visitors
        pubsub.subscribe(`__keyspace@${vk.options.db}__:visitors`)

        // "visitors" holds the locations of all connected visitors
        // used to bring new visits upto speed with the current state of the globe
        vk.hset("visitors", visitorId, JSON.stringify([ latitude, longitude ]))

        updateGlobe()
    }

    socket.onclose = () => {
        pubsub.unsubscribe()

        // Wait 500ms before sending the updated locations to the server
        // This to avoid sending the location of the user that just left
        ctx.waitUntil(
            new Promise((resolve, reject) =>
                setTimeout(() => vk.hdel("visitors", visitorId).then(resolve).catch(reject), 500)
            )
        )
    }

    async function updateGlobe() {
        const visitors = await vk.hgetall("visitors")
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
