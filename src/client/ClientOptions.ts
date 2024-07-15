type RakNetConstructor = new (host: string, port: number) => any;

type Options = {
    version: string;
    offline: boolean;
    username: string;
    host: string;
    port: number;
    skinData: object | null;
    debug: boolean;
    tokensFolder: string;
    raknetClass: RakNetConstructor | null; 
}

const defaultOptions: Required<Options> = {
    version: "1.21.0",
    offline: false,
    username: "defaultUser",
    host: "127.0.0.1",
    port: 19132,
    skinData: null,
    debug: false,
    tokensFolder: process.cwd() + "/tokens",
    raknetClass: null
};

export { Options, defaultOptions };
