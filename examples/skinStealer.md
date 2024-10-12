# Skin Stealer Example

This example demonstrates how to create a Bedrock Edition client that connects to a server and saves the skin images of players it encounters.

## Prerequisites

- Node.js / Bun installed on your system
- Required packages: `jimp`, `fs`, and the client library.

## Installation

Make sure you have the necessary dependencies installed:

```bash
npm install jimp
npm install @sanctumterra/client
```

## Usage

```ts
import Jimp from "jimp";
import { Client } from "../src";
import fs from "node:fs";

const client = new Client({
    host: "127.0.0.1", // Replace with the server's IP address
    port: 19133,       // Replace with the server's port
    offline: true,
    username: "SkinCollector"
});

client.connect();

client.on("PlayerListPacket", (packet) => {
    for (const record of packet.records) {
        const skinData = record.skin?.skinImage;
        if (!skinData) continue;

        const skin = new Jimp({...skinData});
        
        if (!fs.existsSync("./skins")) {
            fs.mkdirSync("./skins");
        }
        
        skin.write(`./skins/${record.username}.png`, (err) => {
            if (err) {
                console.error(`Error saving skin for ${record.username}:`, err);
            } else {
                console.log(`Saved skin for ${record.username}`);
            }
        });
    }
});
```

## How it works

1. The client connects to the specified Bedrock Edition server.
2. When it receives a `PlayerListPacket`, it iterates through the player records.
3. For each player with skin data, it creates a Jimp image from the skin data.
4. The skin image is then saved to the `./skins` directory with the player's username as the filename.

Note: This example is for educational purposes only. Always respect player privacy and server rules when using or modifying this code.
