import { type Attribute, AttributeName } from "@serenityjs/protocol";

export class ClientAtributes {
	public attributes: Map<AttributeName, Attribute> = new Map();

	getHealth(): number {
		return this.attributes.get(AttributeName.Health)?.current ?? 0;
	}

	getMaxHealth(): number {
		return this.attributes.get(AttributeName.Health)?.max ?? 0;
	}

	getHunger(): number {
		return this.attributes.get(AttributeName.PlayerHunger)?.current ?? 0;
	}

	getMaxHunger(): number {
		return this.attributes.get(AttributeName.PlayerHunger)?.max ?? 0;
	}

	getSaturation(): number {
		return this.attributes.get(AttributeName.PlayerSaturation)?.current ?? 0;
	}

	getMaxSaturation(): number {
		return this.attributes.get(AttributeName.PlayerSaturation)?.max ?? 0;
	}
}
