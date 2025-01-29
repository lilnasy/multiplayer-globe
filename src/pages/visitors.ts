import Valkey, { type RedisOptions } from "iovalkey"

export type Message =
    | {
        /** The current state of the globe, sent to visitors whn they join. */
        globe: Record<string, Location>,
        /**
         * Self ID. Visitors are sent their own ID so their their own location
         * can be emphasized on the globe.
         */
        id: string
    }
    /** A visitor joined, their marker should be added. */
    | { add: { id: string, location: Location } }
    /** A visitor left, their marker should be removed. */
    | { remove: { id: string } }

export type Location  = [
    latitude: string | number,
    longitude: string | number
]

/**
 * If these environment variables are not set, the default
 * values will be used, and the server will attempt to
 * connect to the locally running valkey server on port 6379.
 */
const vkOptions: RedisOptions = {   
    host:     import.meta.env.VALKEY_HOST,
    port:     import.meta.env.VALKEY_PORT,
    username: import.meta.env.VALKEY_USERNAME,
    password: import.meta.env.VALKEY_PASSWORD,
    db:       import.meta.env.VALKEY_DB
}

export const prerender = false

export function GET(ctx: import('astro').APIContext) {
    const { socket, response } = ctx.locals.upgradeWebSocket()
    const {
        // use random values in dev
        latitude = Math.random() * 180 - 90,
        longitude = Math.random() * 360 - 180
    } = ctx.locals.runtime?.cf ?? {}

    const location = JSON.stringify([ latitude, longitude ])

    const vk = new Valkey(vkOptions)

    // pubsub requires a dedicated connection
    // unless the redis client is using resp3,
    // which is not supported by iovalkey yet
    const pubsub = new Valkey(vkOptions)

    /**
     * Non-personally identifiable visitor ID.
     * Unique to the visit, not to the user.
     */
    const visitorId = crypto.randomUUID()

    function globeUpdate(channel: string, _location: string) {
        const location: Location = JSON.parse(_location)
        const message: Message = channel === "visit:start"
            ? { add: { id: visitorId, location } }
            : { remove: { id: visitorId } }
        socket.send(JSON.stringify(message))
    }


    socket.onopen = async () => {
        pubsub.subscribe("visit:start", "visit:end")
        pubsub.on("message", globeUpdate)

        // "visitors" holds the locations of all connected visitors
        // used to bring new visits upto speed with the current state of the globe
        vk.hset("visitors", visitorId,location)

        // after the initial state has been sent, clients are given
        // granular updates about other visitors coming and going
        vk.publish("visit:start", location)

        const visitors = await vk.hgetall("visitors")
 
        // the client may have quickly disconnected while we were waiting on the "hgetall"
        if (socket.readyState === WebSocket.OPEN) {
            const message: Message = {
                globe: Object.fromEntries(Object.entries(visitors).map(([visitorId, location]) =>
                    [ visitorId, JSON.parse(location) as Location ]
                )),
                id: visitorId
            }
            socket.send(JSON.stringify(message))
        }
    }

    socket.onclose = () => {
        pubsub.unsubscribe("visit:start")
        pubsub.unsubscribe("visit:end")
        pubsub.off("message", globeUpdate)

        ctx.locals.runtime.ctx.waitUntil(new Promise((resolve, reject) => {
            // Wait 500ms before sending the updated locations to the server
            // This to avoid sending the location of the user that just left
            setTimeout(() => {
                Promise.all([
                    vk.hdel("visitors", visitorId),
                    vk.publish("visit:end", location)
                ])
                .then(resolve)
                .catch(reject)
            }, 500)
        }))
    }

    return response
}
