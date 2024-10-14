import { Authflow, Titles } from "prismarine-auth";
import { v3 } from "uuid-1345";
import { Logger } from "../vendor/Logger";
import type { Connection } from "../Connection";
import { measureExecutionTimeForFunction } from "src/vendor/debug-tools";

interface Profile {
	name: string;
	uuid: string;
	xuid: number;
}

const UUID_NAMESPACE = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";

function generateUUID(username: string): string {
	return v3({ namespace: UUID_NAMESPACE, name: username });
}

const createOfflineSession = measureExecutionTimeForFunction(
	async function createOfflineSession(client: Connection): Promise<void> {
		if (!client.options.username) {
			throw new Error("Must specify a valid username for offline session");
		}
		const profile: Profile = {
			name: client.options.username,
			uuid: generateUUID(client.options.username),
			xuid: 0,
		};

		await setupClientProfile(client, profile, []);
		await setupClientChains(client, true);
		client.emit("session");
	}
);

const authenticate = measureExecutionTimeForFunction(
	async function authenticate(client: Connection): Promise<void> {
		const startTime = Date.now();

		try {
			const authflow = createAuthflow(client);
			const chains = await getMinecraftBedrockToken(authflow, client);
			const profile = extractProfile(chains[1]);

			const endTime = Date.now();
			Logger.info(
				`Authentication with Xbox took ${(endTime - startTime) / 1000}s.`,
			);

			await setupClientProfile(client, profile, chains);
			await setupClientChains(client);

			client.emit("session");
		} catch (error) {
			Logger.error(
				`Authentication failed: ${error instanceof Error ? error.message : String(error)}`,
			);
			throw error;
		}
	}
);

const realmAuthenticate = measureExecutionTimeForFunction(
	async function realmAuthenticate(client: Connection) {
		console.log(".");
		/*
		if(!client.options.realmOptions || client.options.realmOptions == null) {
			new Error("An error has slipped by, please create an Issue on Github.");
			return;
		}
		const api = RealmAPI.from(createAuthflow(client), 'bedrock')
		const realm = await api.getRealmFromInvite(client.options.realmOptions.realmInvite)
		if (!realm) throw Error("No realm found with that invite.\nPlease join one first.")
		Logger.info("Successfully joined realm")
		const { host, port } = await realm.getAddress()
		client.options.host = host
		client.options.port = port
		*/
	}
);

const createAuthflow = measureExecutionTimeForFunction(
	function createAuthflow(client: Connection): Authflow {
		return new Authflow(
			client.options.username,
			client.options.tokensFolder,
			{
				authTitle: Titles.MinecraftNintendoSwitch,
				flow: "live",
				deviceType: "Nintendo",
			},
			(res: { message: string }) => {
				Logger.info(res.message);
			},
		);
	}
);

const getMinecraftBedrockToken = measureExecutionTimeForFunction(
	async function getMinecraftBedrockToken(
		authflow: Authflow,
		client: Connection,
	): Promise<string[]> {
		try {
			// @ts-expect-error Wrong param type in Authflow definition
			return await authflow.getMinecraftBedrockToken(
				// @ts-expect-error Wrong param type in Authflow definition
				client.data.loginData.clientX509,
			);
		} catch (error) {
			Logger.error(
				`Error while getting Chains: ${error instanceof Error ? error.message : String(error)}`,
			);
			throw error;
		}
	}
);

const extractProfile = measureExecutionTimeForFunction(
	function extractProfile(jwt: string): Profile {
		const [, payload] = jwt.split(".");
		const xboxProfile = JSON.parse(Buffer.from(payload, "base64").toString());

		return {
			name: xboxProfile?.extraData?.displayName || "Player",
			uuid:
				xboxProfile?.extraData?.identity ||
				"adfcf5ca-206c-404a-aec4-f59fff264c9b",
			xuid: xboxProfile?.extraData?.XUID || 0,
		};
	}
);

const setupClientProfile = measureExecutionTimeForFunction(
	function setupClientProfile(
		client: Connection,
		profile: Profile,
		accessToken: string[],
	): void {
		client.data.profile = profile;
		client.data.accessToken = accessToken;
		client.username = profile.name;
	}
);

const setupClientChains = measureExecutionTimeForFunction(
	async function setupClientChains(
		client: Connection,
		offline = false,
	): Promise<void> {
		const [clientIdentityChain, clientUserChain] = await Promise.all([
			client.data.createClientChain(null, offline),
			client.data.createClientUserChain(
				client.data.loginData.ecdhKeyPair.privateKey,
			),
		]);

		client.data.loginData.clientIdentityChain = clientIdentityChain;
		client.data.loginData.clientUserChain = clientUserChain;
	}
);

export {
	authenticate,
	createOfflineSession,
	realmAuthenticate,
	createAuthflow,
	getMinecraftBedrockToken,
	extractProfile,
	setupClientProfile,
	setupClientChains,
	generateUUID,
};






