# 🛠️ Minecraft Bedrock Edition Client Library

![Version](https://img.shields.io/badge/Supported%20Version-1.21.30-brightgreen)
![npm](https://img.shields.io/npm/v/@sanctumterra/client)
![License](https://img.shields.io/badge/License-MIT-blue)

<p align="center">
  <a href="https://discord.gg/tBpMb6Hv7S">
    <img src="https://img.shields.io/static/v1.svg?label=Discord&message=Join&color=blue&logo=discord&style=for-the-badge" alt="Discord">
  </a>
</p>

A powerful and easy-to-use client library for Minecraft Bedrock Edition.

## 📦 Installation

```bash
npm i @sanctumterra/client
```

## ⚠️ Important Notes

- The `Connection` class is a bare-bones client, while the `Client` class offers more features.
- Due to protocol support requirements, versions cannot be automatically switched. Specific client library versions are needed.

## 📊 Supported Versions

| Client Version | Protocol Version  | Minecraft Version |
|----------------|-------------------|-------------------|
| 2.0.10         | 712               | 1.21.20           |
| 2.1.5          | 729               | 1.21.30           |


## 🚀 Usage Example

```typescript
const { Client, Logger, DeviceOS } = require("@sanctumterra/client");

const client = new Client({
    host: "127.0.0.1",
    port: 19132,
    offline: true,
    username: "SanctumTerra",
    tokensFolder: "./cache/tokens",
    version: "1.21.30",
    deviceOS: DeviceOS.Android
});

client.connect();

client.on("TextPacket", (packet) => {
    if (packet.parameters) {
        if (packet.message.includes("chat.type.text")) {
            return Logger.chat(`§f<${packet.parameters[0]}> ${packet.parameters[1]}`);
        }
        if (packet.message.includes("multiplayer.player.joined")) {
            return Logger.chat(`§e${packet.parameters[0]} joined the game`);
        }
        if (packet.message.includes("multiplayer.player.left")) {
            return Logger.chat(`§e${packet.parameters[0]} left the game`);
        }
        if (packet.message.includes("%chat.type.announcement")) {
            return Logger.chat(`§d<${packet.parameters[0]}> ${packet.parameters[1]}`);
        }
    }
    Logger.chat(packet.message);
});

client.on("spawn", () => {
    Logger.info("Spawned!");
});
```

## 📚 Features

### 🎛️ Client Configuration
- **Required Parameters**: `host`, `port`
- **Optional Parameters**: `offline`, `username`, `tokensFolder`, `version`, `deviceOS`

### 📡 Event Handling
- Events allow you to listen to any implemented packet if it is not implemented you will receive a warning and it should not crash if there is a crash then make an issue on github.


### 🎨 Custom Logging
- Supports Minecraft color codes for in-game styled message logging
- Easier to use and understand

## 📜 Changelog

### 2.1.5
- Added DeviceOS to the Client.

### 2.1.3
- Removed Protocol Validation
- Added more debug logs
- Improved performance

### 2.1.2
- Added a couple examples in /examples/ (readline, skinStealer).
- debug logs n options.
- Allow safe disconnection.

### 2.1.0
- Separated Client into Connection and Client classes.
- Fixed CraftingDataPacket for Shields.
- Improved packet handling for pre-spawn packets.
- Enhanced Listener Events for "secret" / "hidden" events.

### 2.0.11
- Added support for Minecraft 1.21.30.

### 2.0.0
- Initial Release of V2.

## ❤️ Credits

| Project | Description | Link |
|---------|-------------|------|
| SerenityJS | Packet processing frameworks | [GitHub](https://github.com/SerenityJS/serenity) |
| PrismarineJS | Authentication framework | [GitHub](https://github.com/PrismarineJS) |

<p align="center">Made with ❤️ by SanctumTerra</p>
