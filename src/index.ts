import { Client } from "./Client";
import { Logger } from "./vendor/Logger";
import { Connection } from "./Connection";


declare global { 
    var shieldID: number;
}

export { Client, Logger, Connection };
