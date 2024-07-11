import { Authflow, Titles } from "prismarine-auth";
import Client from "../../Client";
import { v3 } from "uuid-1345";
import { Logger } from "../../utils/Logger";

function uuidFrom (string: string): string {
  return v3({ namespace: '6ba7b811-9dad-11d1-80b4-00c04fd430c8', name: string })
}

async function createOfflineSession (client: Client): Promise<{profile: {name: string, uuid: string, xuid: number}, chains: string[]}> {
  if (!client.options.username) throw Error('Must specify a valid username')
  const profile = {
    name: client.options.username,
    uuid: uuidFrom(client.options.username),
    xuid: 0
  }
  return {profile: profile, chains: []};
}

async function authenticate (client: Client) {
    const authflow = new Authflow(client.options.username, client.options.tokensFolder, { 
        authTitle: Titles.MinecraftNintendoSwitch, 
        flow: "live",
        deviceType: 'Nintendo'
    }, (res: {message: string} ) => {
        Logger.info(res.message);
    });

    // @ts-expect-error Wrong param type
    const chains = await authflow.getMinecraftBedrockToken(client.data.loginData.clientX509).catch(e => {
      console.log("Error whilw getting Chains! " + client.data.loginData.clientX509);
      throw e
    }) as string[];

    const jwt = chains[1]
    const [header, payload, signature] = jwt.split('.').map(k => Buffer.from(k, 'base64')) // eslint-disable-line
    const xboxProfile = JSON.parse(String(payload))

    const profile: { name: string, uuid: string, xuid: number } = {
      name: xboxProfile?.extraData?.displayName || 'Player',
      uuid: xboxProfile?.extraData?.identity || 'adfcf5ca-206c-404a-aec4-f59fff264c9b',
      xuid: xboxProfile?.extraData?.XUID || 0
    }
    

    return {profile: profile, chains: chains };
}

export {authenticate, createOfflineSession}