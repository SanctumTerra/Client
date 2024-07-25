import { EventEmitter } from "events";

class Listener extends EventEmitter {
    /**
     * 
     * !--------------------------------------! 
     *  
     *   IF YOU HAVE `serenityjs/protocol` INSTALLED
     * 
     *   PACKET  EVENTS  ARE  Packet.name!
     * 
     * !--------------------------------------!
     * @returns {void} 
     */
    on(...args: Parameters<EventEmitter["on"]>): this {
        return super.on(...args)
    }
    /**
     * 
     * !--------------------------------------! 
     *  
     *   IF YOU HAVE `serenityjs/protocol` INSTALLED
     * 
     *   PACKET  EVENTS  ARE  Packet.name!
     * 
     * !--------------------------------------!
     * @returns {void} 
     */
    emit(...args: Parameters<EventEmitter["emit"]>): boolean {
        return super.emit(...args)
    }
}

export { Listener }