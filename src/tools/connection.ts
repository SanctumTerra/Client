import { Connection } from "src/Connection";

const connection = new Connection({
	host: "127.0.0.1",
	port: 19132,
	username: "SanctumTerra",
	version: "1.21.50",
	offline: true,
});

connection.connect();
