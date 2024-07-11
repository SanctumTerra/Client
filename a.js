const { Client } = require("./");

const client = new Client({
    host: "127.0.0.1",
    port: 19132
});

client.connect()

client.on("spawn", () => {
    console.log("Spawned");
})