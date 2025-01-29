export default new WebSocket(`${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/visitors`)
