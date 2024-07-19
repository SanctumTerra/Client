type RakNetConstructor = new (host: string, port: number) => any;


const Versions = [
    "1.21.0",
    "1.21.2"
] as const;



const PROTOCOL = {
    "1.21.0": 685,
    "1.21.2": 686
} as const;

type Options = {
    version: (typeof Versions)[number];
    offline: boolean;
    username: string;
    host: string;
    port: number;
    skinData: object | null;
    debug: boolean;
    tokensFolder: string;
    raknetClass: RakNetConstructor | null; 
    viewDistance: number;
}



const defaultOptions: Required<Options> = {
    version: "1.21.2",
    offline: false,
    username: "defaultUser",
    host: "127.0.0.1",
    port: 19132,
    skinData: null,
    debug: false,
    tokensFolder: process.cwd() + "/tokens",
    raknetClass: null,
    viewDistance: 10
};

export { Options, defaultOptions, PROTOCOL };
