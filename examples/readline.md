# Readline Example

This example demonstrates how to use the readline module to send messages to the server or execute custom commands.

## Features

- Connect to a Minecraft Bedrock server
- Send chat messages to the server
- Execute custom commands (e.g., mining blocks)
- Handle incoming chat messages and events

## Code Example

```ts
import { Vector3f } from "@serenityjs/protocol";
import { Client, Logger } from "../src";
import { createInterface } from "node:readline";

// Create a new client instance
const client = new Client({
    host: "127.0.0.1",
    port: 19133,
    offline: true,
    username: "ReadLineExample"
});

// Set up readline interface
const inter = createInterface({
    input: process.stdin,
    output: process.stdout
});

// Define custom commands
const commands = new Set(["!mine"]);

// Connect to the server and set up event handlers
client.connect().then(() => {
    // Handle user input
    inter.on("line", (message) => {
        const [command] = message.split(" ");
        if (commands.has(command)) {
            client.emit("chat", message);
        } else {
            client.sendMessage(message);
        }
    });

    // Handle custom commands
    // @ts-expect-error chat is not in client events
    client.on("chat", (message: string) => {
        const args = message.split(" ");
        if (args[0] === "!mine" && args.length === 4) {
            const [x, y, z] = args.slice(1).map(Number);
            if (!Number.isNaN(x) && !Number.isNaN(y) && !Number.isNaN(z)) {
                Logger.info(`Attempting to mine a block at ${x}:${y}:${z}`);
                client.break(new Vector3f(x, y, z));
            } else {
                Logger.error("Invalid coordinates for mining");
            }
        }
    });
});

// Define message handler types
type MessageHandler = (param1: string, param2?: string) => void;

// Define message handlers for different types of messages
const messageHandlers: Record<string, MessageHandler> = {
    "chat.type.text": (param1, param2) => {
        Logger.chat(`§f<${param1}> ${param2}§r`);
        client.emit("chat", param2 || "");
    },
    "multiplayer.player.joined": (param1) => Logger.chat(`§e${param1} §ejoined the game§r`),
    "multiplayer.player.left": (param1) => Logger.chat(`§f${param1} §7left the game§r`),
    "chat.type.announcement": (param1, param2) => Logger.chat(`§d[${param1}] ${param2}§r`),
};

// Handle incoming text packets
client.on("TextPacket", (packet) => {
    if (!packet.parameters) return Logger.chat(packet.message);
    
    const [param1, param2] = packet.parameters;
    const messageType = Object.keys(messageHandlers).find(key => packet.message.includes(key));

    if (messageType) {
        messageHandlers[messageType](param1, param2);
    } else {
        console.log(packet.message);
    }
});
```

## Custom Commands

Currently, this example includes one custom command:

- `!mine <x> <y> <z>`: Attempts to mine a block at the specified coordinates.

You can easily add more custom commands by:

1. Adding the command to the `commands` Set.
2. Implementing the command logic in the `client.on("chat", ...)` event handler.

## Contributing

If you have any ideas for improving this example, please open an issue or submit a pull request.