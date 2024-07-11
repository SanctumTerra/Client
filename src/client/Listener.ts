import { EventEmitter } from "events";

class Listener extends EventEmitter {
    /**
     * 
     * !--------------------------------------! 
     *  
     * ! PACKET  EVENTS  ARE  Packet.name!
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
     * ! PACKET  EVENTS  ARE  Packet.name!
     * 
     * !--------------------------------------!
     * @returns {void} 
     */
    emit(...args: Parameters<EventEmitter["emit"]>): boolean {
        return super.emit(...args)
    }
}

export { Listener }