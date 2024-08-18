# 🛠️ Minecraft Bedrock Edition Client Library

## 📌 Supported Version
- **1.21.20**

## ⚙️ Installation

Install the library via npm:

```bash
npm i @sanctumterra/client
```

## 🚀 Usage Example

```typescript
import { Client, Logger } from "@sanctumterra/client";
import { TextPacket } from "@serenityjs/protocol"; // Import packet types

// 🎮 Create a new client instance with the necessary configurations
const client = new Client({
    host: "127.0.0.1",        // 🖥️ Server IP address
    port: 19132,              // 🌐 Server port
    offline: false,           // 🔒 Set to true if the server is offline
    username: "SanctumTerra", // 🧑‍💻 Your Minecraft username
    version: "1.21.20"        // 📦 The Minecraft Bedrock version
});

// 🌐 Connect to the server
client.connect();

// 📥 Handle incoming TextPacket events
client.on("TextPacket", (packet: TextPacket): void => {
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

        // 📝 Log any other message types
        console.log(packet.message);
    }
    // 📜 Default log for any packet message
    Logger.chat(packet.message);
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
