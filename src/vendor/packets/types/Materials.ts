import type { BinaryStream } from "@serenityjs/binarystream";
import { DataType } from "@serenityjs/raknet";

type TrimDataMaterial = {
	material: string;
	color: string;
	item_name: string;
};

class Materials extends DataType {
	public materials: TrimDataMaterial[];

	constructor(materials: TrimDataMaterial[] = []) {
		super();
		this.materials = materials;
	}

	public static read(stream: BinaryStream): Materials {
		const materials = new Materials();
		const length = stream.readVarInt();
		for (let i = 0; i < length; i++) {
			const material = stream.readVarString();
			const color = stream.readVarString();
			const item_name = stream.readVarString();
			materials.materials.push({ material, color, item_name });
		}
		return materials;
	}

	public static write(stream: BinaryStream, value: Materials): void {
		stream.writeVarInt(value.materials.length);
		for (const material of value.materials) {
			stream.writeVarString(material.material);
			stream.writeVarString(material.color);
			stream.writeVarString(material.item_name);
		}
	}
}

export { Materials };
