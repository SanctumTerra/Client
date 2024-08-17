import { Authflow, Titles } from "prismarine-auth";
import { Client } from "../Client";
import { v3 } from "uuid-1345";
import { Logger } from "../vendor/Logger";

interface Profile {
    name: string;
    uuid: string;
    xuid: number;
}

const UUID_NAMESPACE = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';

function generateUUID(username: string): string {
    return v3({ namespace: UUID_NAMESPACE, name: username });
}

async function createOfflineSession(client: Client): Promise<void> {
    if (!client.options.username) {
        throw new Error('Must specify a valid username for offline session');
    }

    const profile: Profile = {
        name: client.options.username,
        uuid: generateUUID(client.options.username),
        xuid: 0
    };

    setupClientProfile(client, profile, []);
}

async function authenticate(client: Client): Promise<void> {
    const startTime = Date.now();

    try {
        const authflow = createAuthflow(client);
        const chains = await getMinecraftBedrockToken(authflow, client);
        const profile = extractProfile(chains[1]);

        const endTime = Date.now();
        Logger.info(`Authentication with Xbox took ${(endTime - startTime) / 1000}s.`);

        setupClientProfile(client, profile, chains);
        setupClientChains(client);

        client.emit("session");
    } catch (error) {
        Logger.error(`Authentication failed: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
}

function createAuthflow(client: Client): Authflow {
    return new Authflow(
        client.options.username,
        client.options.tokensFolder,
        {
            authTitle: Titles.MinecraftNintendoSwitch,
            flow: "live",
            deviceType: 'Nintendo'
        },
        (res: { message: string }) => {
            Logger.info(res.message);
        }
    );
}

async function getMinecraftBedrockToken(authflow: Authflow, client: Client): Promise<string[]> {
    try {
        // @ts-expect-error Wrong param type in Authflow definition
        return await authflow.getMinecraftBedrockToken(client.data.loginData.clientX509);
    } catch (error) {
        Logger.error(`Error while getting Chains: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
}

function extractProfile(jwt: string): Profile {
    const [, payload] = jwt.split('.');
    const xboxProfile = JSON.parse(Buffer.from(payload, 'base64').toString());

    return {
        name: xboxProfile?.extraData?.displayName || 'Player',
        uuid: xboxProfile?.extraData?.identity || 'adfcf5ca-206c-404a-aec4-f59fff264c9b',
        xuid: xboxProfile?.extraData?.XUID || 0
    };
}

function setupClientProfile(client: Client, profile: Profile, accessToken: string[]): void {
    client.data.profile = profile;
    client.data.accessToken = accessToken;
    client.username = profile.name;
}

function setupClientChains(client: Client): void {
    client.data.loginData.clientIdentityChain = client.data.createClientChain(null, false);
    client.data.loginData.clientUserChain = client.data.createClientUserChain(client.data.loginData.ecdhKeyPair.privateKey);
}

export { authenticate, createOfflineSession };