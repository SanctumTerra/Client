const Versions = [
    "1.21.20"
] as const;

enum ProtocolList {
    "1.21.20" = 712
}

type RealmOptions = {
    realmInvite: string;
}

type ClientOptions = {
    version: (typeof Versions)[number];
    offline: boolean;
    username: string;
    host: string;
    port: number;
    skinData: object | null;
    debug: boolean;
    tokensFolder: string;
    viewDistance: number;
    validateProtocol: boolean;
    loadPlugins: boolean;
    //realm: boolean;
    //realmOptions: RealmOptions | null;
}

const defaultOptions: ClientOptions = {
    version: "1.21.20",
    offline: false,
    username: "defaultUser",
    host: "127.0.0.1",
    port: 19132,
    skinData: null,
    debug: false,
    tokensFolder: process.cwd() + "/tokens",
    viewDistance: 10,
    validateProtocol: true,
    loadPlugins: true
    //realm: false,
    //realmOptions: null
};

export { 
    ClientOptions,
    RealmOptions,
    defaultOptions,
    ProtocolList
}