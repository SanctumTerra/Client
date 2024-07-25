## Registering a Handler.

### Handlers handle Packets while keeping your code sorted


```ts
import { DisconnectPacket } from "@serenityjs/protocol";
import { Client, BaseHandler, Logger } from "@sanctumterra/client";

// Create the Client instance
const client = new Client({
    host: '127.0.0.1',
    port: 19132,
    version: "1.21.2"
}); 

// Create a Handler Class
class DisconnectHandler extends BaseHandler {
    public name: string = DisconnectPacket.name;

    public handle(packet: DisconnectPacket): void {
        Logger.info("Disconnected : "+packet.message ?? "");
        // Client class is actually public, and you may access it by doing _client
    }
}

// Register the Handler to the client
client.packetHandler.registerHandler(
    new DisconnectHandler() // Handler constructors should not have any params!
)

// Do you wish to remove an existing Handler? It can be done with ease!
client.packetHandler.removeHandler(
    DisconnectPacket.name
)
```