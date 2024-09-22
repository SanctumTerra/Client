import { Client } from "src/Client";

const client = new Client({
	host: "127.0.0.1",
	offline: true,
	username: "SanctumTerra",
	version: "1.21.30",
	port: 19132,
	loadPlugins: false,
	validateProtocol: false,
});
client.connect();
