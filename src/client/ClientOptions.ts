const Versions = ["1.21.20", "1.21.30", "1.21.40", "1.21.50"] as const;

enum ProtocolList {
	"1.21.20" = 712,
	"1.21.30" = 729,
	"1.21.40" = 748,
	"1.21.50" = 766,
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
	compressionThreshold: number;
	tokensFolder: string;
	viewDistance: number;
	deviceOS: DeviceOS;
	sendAuthInput: boolean;
	logPacketErrors: boolean;
	tickRate: number;
};

const defaultOptions: ClientOptions = {
	version: "1.21.50",
	offline: false,
	username: "defaultUser",
	host: "127.0.0.1",
	port: 19132,
	skinData: null,
	debug: false,
	compressionThreshold: 512,
	tokensFolder: `${process.cwd()}/tokens`,
	viewDistance: 4,
	deviceOS: DeviceOS.Win10,
	sendAuthInput: true,
	logPacketErrors: false,
	tickRate: 50,
};

export {
	type ClientOptions,
	type RealmOptions,
	defaultOptions,
	ProtocolList,
	DeviceOS,
};
