const Versions = [ "1.21.20", "1.21.30" ] as const;

enum ProtocolList {
	"1.21.20" = 712,
	"1.21.30" = 729,
}

type RealmOptions = {
	realmInvite: string;
};

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
};

const defaultOptions: ClientOptions = {
	version: "1.21.30",
	offline: false,
	username: "defaultUser",
	host: "127.0.0.1",
	port: 19132,
	skinData: null,
	debug: false,
	tokensFolder: `${process.cwd()}/tokens`,
	viewDistance: 10,
	validateProtocol: true,
	loadPlugins: true
};

export { type ClientOptions, type RealmOptions, defaultOptions, ProtocolList };
