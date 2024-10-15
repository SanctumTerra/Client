const Versions = ["1.21.20", "1.21.30"] as const;

enum ProtocolList {
	"1.21.20" = 712,
	"1.21.30" = 729,
}

enum DeviceOS {
	Undefined = 0,
	Android = 1,
	IOS = 2,
	OSX = 3,
	FireOS = 4,
	GearVR = 5,
	Hololens = 6,
	Win10 = 7,
	Win32 = 8,
	Dedicated = 9,
	TVOS = 10,
	Orbis = 11,
	NintendoSwitch = 12,
	Xbox = 13,
	WindowsPhone = 14,
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
	loadPlugins: boolean;
	deviceOS: DeviceOS;
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
	loadPlugins: false,
	deviceOS: DeviceOS.Win10,
};

export {
	type ClientOptions,
	type RealmOptions,
	defaultOptions,
	ProtocolList,
	DeviceOS,
};
