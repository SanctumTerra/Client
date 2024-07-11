import { BaseHandler } from "./BaseHandler";
import * as fs from 'fs';
import * as path from 'path';
import Client from "../../Client";

class PacketHandler {
    private handlers: Map<string, BaseHandler>;
    private client: Client;
    private handlersDir: string;

    constructor(client: Client, handlersDir: string = __dirname+ '/list') {
        if(!handlersDir.endsWith("handlers/list")){
            handlersDir = path.join(process.cwd(), "src", "handlers", "list");
        }
        this.client = client;
        this.handlers = new Map();
        this.handlersDir = handlersDir;
        this.loadHandlers();
    }

    private async loadHandlers() {
        const files = fs.readdirSync(this.handlersDir);

        for (const file of files) {
            if (file.endsWith('.js') || file.endsWith('.ts')) {
                const fullPath = path.join(this.handlersDir, file);
                const handlerModule = await import(fullPath);
                const HandlerClass = Object.values(handlerModule)[0] as new () => BaseHandler;
                const handler = new HandlerClass();
                this.registerHandler(handler);
            }
        }

        this.bindHandlers();
    }

    private bindHandlers() {
        this.handlers.forEach(handler => {
            this.client.on(handler.name, handler.handle.bind(handler));
        });
    }

    reload() {
        this.handlers.forEach(handler => {
            this.client.off(handler.name, handler.handle);
        });
        this.bindHandlers();
    }

    getHandler(name: string) {
        return this.handlers.get(name);
    }

    removeHandler(name: string) {
        const handler = this.handlers.get(name);
        if (handler) {
            this.client.off(handler.name, handler.handle);
            this.handlers.delete(name);
        }
    }

    registerHandler(handler: BaseHandler) {
        this.handlers.set(handler.name, handler);
    }
}

export default PacketHandler;