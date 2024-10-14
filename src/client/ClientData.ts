import {
	generateKeyPairSync,
	type KeyExportOptions,
	type KeyObject,
	type KeyPairKeyObjectResult,
} from "node:crypto";
import type { SignOptions } from "jsonwebtoken";
import * as UUID from "uuid-1345";
import * as skin from "./skin/Skin.json";
import type {
	AnimatedImageData,
	PersonaPieces,
	PieceTintColors,
} from "./skin/Skin";
import type { Advertisement } from "@sanctumterra/raknet";
import type { Connection } from "../Connection";
import _ from 'lodash';
import fastJsonStableStringify from 'fast-json-stable-stringify';
import { promisify } from 'node:util';
import { sign as signCallback, type Secret } from 'jsonwebtoken';

const signAsync = promisify(signCallback) as unknown as (payload: string | Buffer | object, secretOrPrivateKey: Secret, options?: SignOptions | undefined) => Promise<string>;

type LoginData = {
	ecdhKeyPair: KeyPairKeyObjectResult;
	publicKeyDER: string | Buffer;
	privateKeyPEM: string | Buffer;
	clientX509: string;
	clientIdentityChain: string;
	clientUserChain: string;
};

type Encryptions = {
	compressionLevel: number;
};

type Profile = {
	name: string;
	uuid: string;
	xuid: number;
};

export type Payload = {
	AnimatedImageData: AnimatedImageData[];
	ArmSize: string;
	CapeData: string;
	CapeId: string;
	CapeImageHeight: number;
	CapeImageWidth: number;
	CapeOnClassicSkin: boolean;
	ClientRandomId: number;
	CompatibleWithClientSideChunkGen: boolean;
	CurrentInputMode: number;
	DefaultInputMode: number;
	DeviceId: string;
	DeviceModel: string;
	DeviceOS: number;
	GameVersion: string;
	GuiScale: number;
	IsEditorMode: boolean;
	LanguageCode: string;
	OverrideSkin: boolean;
	PersonaPieces: PersonaPieces[];
	PersonaSkin: boolean;
	PieceTintColors: PieceTintColors[];
	PlatformOfflineId: string;
	PlatformOnlineId: string;
	PlayFabId: string;
	PremiumSkin: boolean;
	SelfSignedId: string;
	ServerAddress: string;
	SkinAnimationData: string;
	SkinColor: string;
	SkinGeometryDataEngineVersion: string;
	SkinData: string;
	SkinGeometryData: string;
	SkinId: string;
	SkinImageHeight: number;
	SkinImageWidth: number;
	SkinResourcePatch: string;
	ThirdPartyName: string;
	ThirdPartyNameOnly: boolean;
	TrustedSkin: boolean;
	UIProfile: number;
};

const PUBLIC_KEY =
	"MHYwEAYHKoZIzj0CAQYFK4EEACIDYgAECRXueJeTDqNRRgJi/vlRufByu/2G0i2Ebt6YMar5QX/R0DIIyrJMcUpruK4QveTfJSTp3Shlq4Gk34cD/4GUWwkv0DVuzeuB+tXija7HBxii03NHDbPAD0AKnLr2wdAp";
const algorithm = "ES384";
const curve = "secp384r1";
const pem: KeyExportOptions<"pem"> = { format: "pem", type: "sec1" };
const der: KeyExportOptions<"der"> = { format: "der", type: "spki" };

type MemoizedClientChainFunction = (mojangKey: string | null, offline: boolean) => Promise<string>;
type MemoizedClientUserChainFunction = (privateKey: KeyObject, customPayload: Partial<Payload>) => Promise<string>;

class ClientData {
	public loginData: LoginData;
	private client: Connection;
	public iv: Buffer = Buffer.alloc(0);
	public encryption: Encryptions;
	public serverAdvertisement!: Advertisement;
	public profile!: Profile;
	public accessToken!: string[];
	public sendDeflated = false;
	public compressionThreshold!: number;
	public sharedSecret!: Buffer;
	public secretKeyBytes!: Buffer;
	private defaultPayload: Payload | null = null;
	private _memoizedCreateClientChain: MemoizedClientChainFunction | null = null;
	private _memoizedCreateClientUserChain: MemoizedClientUserChainFunction | null = null;

	constructor(client: Connection) {
		this.client = client;
		this.loginData = this.prepareLoginData();
		this.encryption = {
			compressionLevel: 7,
		};
	}

	private prepareLoginData() {
		const ecdhKeyPair = generateKeyPairSync("ec", { namedCurve: curve });
		const loginData = {
			ecdhKeyPair: ecdhKeyPair,
			publicKeyDER: Buffer.alloc(0),
			privateKeyPEM: "",
			clientX509: "",
			clientIdentityChain: "",
			clientUserChain: "",
		};
		loginData.ecdhKeyPair = generateKeyPairSync("ec", { namedCurve: curve });
		loginData.publicKeyDER = loginData.ecdhKeyPair.publicKey.export(der);
		loginData.privateKeyPEM = loginData.ecdhKeyPair.privateKey
			.export(pem)
			.toString("base64");
		loginData.clientX509 = loginData.publicKeyDER.toString("base64");

		return loginData;
	}

	private createDefaultPayload(): Payload {
		return {
			AnimatedImageData: skin.skinData.AnimatedImageData as AnimatedImageData[],
			ArmSize: skin.skinData.ArmSize,
			CapeData: skin.skinData.CapeData,
			CapeId: skin.skinData.CapeId,
			CapeImageHeight: skin.skinData.CapeImageHeight,
			CapeImageWidth: skin.skinData.CapeImageWidth,
			CapeOnClassicSkin: skin.skinData.CapeOnClassicSkin,
			ClientRandomId: Date.now(),
			CompatibleWithClientSideChunkGen: false,
			CurrentInputMode: 1,
			DefaultInputMode: 1,
			DeviceId: this.nextUUID(),
			DeviceModel: "Helicopter",
			DeviceOS: 7,
			GameVersion: this.client.options.version,
			GuiScale: 0,
			IsEditorMode: false,
			LanguageCode: "en_US",
			OverrideSkin: false,
			PersonaPieces: skin.skinData.PersonaPieces,
			PersonaSkin: skin.skinData.PersonaSkin,
			PieceTintColors: skin.skinData.PieceTintColors,
			PlatformOfflineId: "",
			PlatformOnlineId: "",
			PlayFabId: this.nextUUID().replace(/-/g, "").slice(0, 16),
			PremiumSkin: skin.skinData.PremiumSkin,
			SelfSignedId: this.nextUUID(),
			ServerAddress: `${this.client.options.host}:${this.client.options.port}`,
			SkinAnimationData: skin.skinData.SkinAnimationData,
			SkinColor: skin.skinData.SkinColor,
			SkinGeometryDataEngineVersion:
				skin.skinData.SkinGeometryDataEngineVersion,
			SkinData: skin.skinData.SkinData,
			SkinGeometryData: skin.skinData.SkinGeometryData,
			SkinId: skin.skinData.SkinId,
			SkinImageHeight: skin.skinData.SkinImageHeight,
			SkinImageWidth: skin.skinData.SkinImageWidth,
			SkinResourcePatch: skin.skinData.SkinResourcePatch,
			ThirdPartyName: this.profile?.name || "Player",
			ThirdPartyNameOnly: false,
			TrustedSkin: skin.skinData.TrustedSkin,
			UIProfile: 0,
		};
	}

	private getDefaultPayload(): Payload {
		if (!this.defaultPayload) {
			this.defaultPayload = this.createDefaultPayload();
		}
		return this.defaultPayload;
	}

	private async createClientChainInternal(mojangKey: string | null, offline: boolean): Promise<string> {
		const { clientX509, ecdhKeyPair } = this.loginData;
		let payload: Record<string, unknown>;
		let signOptions: SignOptions;

		if (offline) {
			payload = {
				extraData: {
					displayName: this.client.data.profile.name,
					identity: this.client.data.profile.uuid,
					titleId: "89692877",
					XUID: "0",
				},
				certificateAuthority: true,
				identityPublicKey: clientX509,
			};
			signOptions = {
				algorithm: algorithm,
				notBefore: 0,
				issuer: "self",
				expiresIn: 60 * 60,
				header: { alg: algorithm, x5u: clientX509, typ: undefined },
			};
		} else {
			payload = {
				identityPublicKey: mojangKey || PUBLIC_KEY,
				certificateAuthority: true,
			};
			signOptions = {
				algorithm: algorithm,
				header: { alg: algorithm, x5u: clientX509, typ: undefined },
			};
		}

		return signAsync(payload, ecdhKeyPair.privateKey.export({ format: 'pem', type: 'pkcs8' }) as string, signOptions);
	}

	private getMemoizedCreateClientChain(): MemoizedClientChainFunction {
		if (!this._memoizedCreateClientChain) {
			this._memoizedCreateClientChain = _.memoize(
				this.createClientChainInternal.bind(this),
				(mojangKey: string | null, offline: boolean) => `${mojangKey}-${offline}`
			) as MemoizedClientChainFunction;
		}
		return this._memoizedCreateClientChain;
	}

	public async createClientChain(mojangKey: string | null, offline: boolean): Promise<string> {
		const memoizedFunction = this.getMemoizedCreateClientChain();
		return memoizedFunction(mojangKey, offline);
	}

	private getMemoizedCreateClientUserChain(): MemoizedClientUserChainFunction {
		if (!this._memoizedCreateClientUserChain) {
			this._memoizedCreateClientUserChain = _.memoize(
				async (privateKey: KeyObject, customPayload: Partial<Payload>): Promise<string> => {
					const { clientX509 } = this.loginData;

					const payload: Payload = {
						...this.getDefaultPayload(),
						...customPayload,
						ServerAddress: `${this.client.options.host}:${this.client.options.port}`,
						ClientRandomId: Date.now(),
						DeviceId: this.nextUUID(),
						PlayFabId: this.nextUUID().replace(/-/g, "").slice(0, 16),
						SelfSignedId: this.nextUUID(),
					};

					return signAsync(payload, privateKey.export({ format: 'pem', type: 'pkcs8' }) as string, {
						algorithm,
						header: { alg: algorithm, x5u: clientX509, typ: undefined },
						noTimestamp: true,
					});
				},
				(privateKey: KeyObject, customPayload: Partial<Payload>) => fastJsonStableStringify(customPayload)
			) as MemoizedClientUserChainFunction;
		}
		return this._memoizedCreateClientUserChain;
	}

	public async createClientUserChain(privateKey: KeyObject): Promise<string> {
		const customPayload = this.client.options.skinData || {};
		const memoizedFunction = this.getMemoizedCreateClientUserChain();
		return memoizedFunction(privateKey, customPayload);
	}

	public uuidFrom(string: string) {
		return UUID.v3({
			namespace: "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
			name: string,
		});
	}

	public nextUUID() {
		return this.uuidFrom(Date.now().toString());
	}
}

export { ClientData };
