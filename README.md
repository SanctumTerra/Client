# 🛠️ Minecraft Bedrock Edition Client Library

![Version](https://img.shields.io/badge/Supported%20Version-1.21.20-brightgreen)
![npm](https://img.shields.io/npm/v/@sanctumterra/client)
![License](https://img.shields.io/badge/License-MIT-blue)

A powerful and easy-to-use client library for Minecraft Bedrock Edition.

## 📦 Installation

Install the library via npm:

```bash
npm i @sanctumterra/client
```

> [!IMPORTANT]  
> Due to some features needing protocol support the versions can not be automatically switched, and will require a specific client version.



## 📊 Supported Versions

| Client Version | Protocol Version | Minecraft Version |
|----------------|-------------------|-------------------|
| 2.0.10         | 712               | 1.21.20           |
| 2.0.11         | 729               | 1.21.30           |




## 🚀 Usage Example

```typescript
// Import the Client, logger from the @sanctumterra/client package
const { Client, Logger } = require("@sanctumterra/client");

// Create a new instance of the Client with the specified options
const client = new Client({
    host: "127.0.0.1", // The IP address of the server
    port: 19133, // The port of the server
    offline: true, // Whether the client is offline or not
    username: "SanctumTerra", // The username of the client
    tokensFolder: "./cache/tokens", // The folder where the tokens are stored
    version: "1.21.20", // The version of the game
    validateProtocol: false, // Whether to validate the protocol or not
    loadPlugins: false // Whether to load plugins or not
});

// Connect to the server
client.connect();

// Text Packet Event 
client.on("TextPacket", (packet) => {
    console.log(packet.message);
    if (packet.parameters) {
       // 🗨️ Handle standard chat messages
        if (packet.message.includes("chat.type.text")) {
            return Logger.chat(`§f<${packet.parameters[0]}> ${packet.parameters[1]}`);
        }
        // ➕ Handle player join messages
        if (packet.message.includes("multiplayer.player.joined")) {
            return Logger.chat(`§e${packet.parameters[0]} joined the game`);
        }
        // ➖ Handle player leave messages
        if (packet.message.includes("multiplayer.player.left")) {
            return Logger.chat(`§e${packet.parameters[0]} left the game`);
        }
        if(packet.message.includes("%chat.type.announcement")) {
            return Logger.chat(`§d<${packet.parameters[0]}> ${packet.parameters[1]}`);
        }
    }
    // 📜 Default log for any packet message
    Logger.chat(packet.message);
});

// Emitted when the client spawns.
client.on("spawn", () => {
    // You may use any type of logger you want ;)
    Logger.info("Spawned!");
});

```

---

## 📚 Explanation

### 🎛️ Client Configuration

- **Required Parameters**:
  - **Host**: Server's IP address.
  - **Port**: Server's port number.

### 📡 Event Handling

- The example listens for `TextPacket` events:
  - **Chat Messages**: Identified by `chat.type.text`, and formatted using `Logger.chat`.
  - **Player Join**: Detected by `multiplayer.player.joined`, and logged with a join message.
  - **Player Leave**: Triggered by `multiplayer.player.left`, and logged with a leave message.
  - **Other Messages**: All other messages are logged to the console.

### 🎨 Custom Logging

- The custom `Logger` supports **Minecraft color codes**, enabling colorful, in-game styled message logging.
- This feature allows for **seamless integration** with Minecraft’s native chat system, without the need for third-party color libraries.

---


### ❤️ Credits

| **Project**     | **Description**                                            | **Link**                                     |
|-----------------|------------------------------------------------------------|----------------------------------------------|
| **SerenityJS**  | Provides frameworks for processing packets.                 | [GitHub Repository](https://github.com/SerenityJS/serenity) |
| **PrismarineJS**| Provides the framework needed for authentication.           | [GitHub Repository](https://github.com/PrismarineJS) |

---


<p align="center">Made with ❤️ by SanctumTerra</p>