<script lang="ts">
    import { onMount } from "svelte"
    import { on } from "svelte/events"
    import { SvelteMap as Map } from "svelte/reactivity"
    import createGlobe from "cobe"
    import ws from "./websocket-user.ts"

    const props = $props<{ class?: string}>()

    let canvas: HTMLCanvasElement
    let phi = $state(0)
    let connected = $state(false)

    /**
     * locations keyed to a non-personally identifiable visitor id
     */
    let ownId = $state<string | null>(null)
    const locations = new Map<string, import("../pages/visitors.ts").Location>
    const markers = $derived(
        Array.from(locations).map(([id, location]) => ({
            location,
            // highlight self
            size: id === ownId ? 0.1 : 0.05,
        }))
    )


    on(ws, "message", event => {
        // `on()` from svelte/events' is not generic, so we need this check
        if ("data" in event === false || typeof event.data !== "string") return

        const message: import("../pages/visitors.ts").Message = JSON.parse(event.data)

        if ("globe" in message) {
            connected = true
            ownId = message.id
            locations.clear()
            for (const location in message.globe) {
                locations.set(location, message.globe[location])
            }
        }
        if ("add" in message) {
            locations.set(message.add.id, message.add.location)
        }
        if ("remove" in message) {
            locations.delete(message.remove.id)
        }
    })

    onMount(() => {
        // @ts-ignore
        const c = canvas
        createGlobe(c, {
            devicePixelRatio: 2,
            width: 400 * 2,
            height: 400 * 2,
            phi: 0,
            theta: 0,
            dark: 1,
            diffuse: 0.8,
            mapSamples: 16000,
            mapBrightness: 6,
            baseColor: [0.3, 0.3, 0.3],
            markerColor: [0.1, 0.8, 0.1],
            glowColor: [0.2, 0.2, 0.2],
            markers: [],
            opacity: 0.7,
            onRender(state) {
                state.markers = markers
                state.phi = phi
                phi += 0.01
            },
        })
    })
</script>

<div class={props?.class}>
    <h1>Where's everyone at?</h1>
    <p>
        {#if connected}
            <b>{ locations.size }</b> { locations.size === 1 ? "person" : "people" } connected.
        {:else}
            Connecting...
        {/if}

    </p>
    <canvas bind:this={canvas}></canvas>
    <p>

        Powered by <a href="https://cobe.vercel.app/">Cobe</a>.<br>
        Inspired by
        <a href="https://github.com/cloudflare/templates/tree/main/multiplayer-globe-template">Cloudflare's multiplayer-globe-template</a>.
    </p>
</div>

<style>
    canvas {
        width: 400px;
        height: 400px;
        max-width: 100%;
        aspect-ratio: 1;
    }
    b {
        color: white;
    }
    a {
        color: #ccc;
        text-underline-offset: 3px;
        text-decoration-color: #555;
    }
    a:hover {
        color: #ddd;
    }
</style>