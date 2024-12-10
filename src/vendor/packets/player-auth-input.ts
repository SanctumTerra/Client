import { Endianness } from "@serenityjs/binarystream";
import {
	ClientPredictedVehicle,
	DataPacket,
	InputData,
	type InputMode,
	InputTransaction,
	type InteractionMode,
	ItemStackRequest,
	Packet,
	PlayerAuthInputData,
	PlayerAuthItemStackRequest,
	PlayerBlockActions,
	PlayerInputTick,
	type PlayMode,
	Vector2f,
	Vector3f,
} from "@serenityjs/protocol";
import { Proto } from "@serenityjs/raknet";

@Proto(Packet.PlayerAuthInput)
export class PlayerAuthInputPacket extends DataPacket {
	public rotation!: Vector2f;
	public position!: Vector3f;
	public motion!: Vector2f;
	public headYaw!: number;
	public inputData!: PlayerAuthInputData;
	public inputMode!: InputMode;
	public playMode!: PlayMode;
	public interactionMode!: InteractionMode;
	public interactRotation!: Vector2f;
	public tick!: bigint;
	public positionDelta!: Vector3f;
	public inputTransaction!: InputTransaction | null;
	public itemStackRequest!: PlayerAuthItemStackRequest | null;
	public blockActions!: PlayerBlockActions | null;
	public predictedVehicle!: ClientPredictedVehicle | null;
	public analogueMotion!: Vector2f;
	public cameraOrientation!: Vector3f;

	public override serialize(): Buffer {
		this.writeVarInt(Packet.PlayerAuthInput);
		Vector2f.write(this, this.rotation);
		Vector3f.write(this, this.position);
		Vector2f.write(this, this.motion);
		this.writeFloat32(this.headYaw, Endianness.Little);
		PlayerAuthInputData.write(this, this.inputData);
		this.writeVarInt(this.inputMode);
		this.writeVarInt(this.playMode);
		this.writeVarInt(this.interactionMode);
		Vector2f.write(this, this.interactRotation);
		PlayerInputTick.write(this, this.tick);
		Vector3f.write(this, this.positionDelta);
		if (this.inputTransaction) {
			InputTransaction.write(this, this.inputTransaction);
		}
		if (this.itemStackRequest) {
			PlayerAuthItemStackRequest.write(
				this,
				this.itemStackRequest,
				0,
				this.inputData,
			);
		}
		if (this.blockActions) {
			PlayerBlockActions.write(this, this.blockActions, 0, this.inputData);
		}
		if (this.predictedVehicle) {
			ClientPredictedVehicle.write(
				this,
				this.predictedVehicle,
				0,
				this.inputData,
			);
		}
		Vector2f.write(this, this.analogueMotion);
		Vector3f.write(this, this.cameraOrientation);
		return this.getBuffer();
	}
	public override deserialize(): this {
		this.readUint8();
		this.rotation = Vector2f.read(this);
		this.position = Vector3f.read(this);
		this.motion = Vector2f.read(this);
		this.headYaw = this.readFloat32(Endianness.Little);
		this.inputData = PlayerAuthInputData.read(this);
		this.inputMode = this.readVarInt();
		this.playMode = this.readVarInt();
		this.interactionMode = this.readVarInt();
		this.interactRotation = Vector2f.read(this);
		this.tick = PlayerInputTick.read(this);
		this.positionDelta = Vector3f.read(this);
		if (this.inputData.hasFlag(InputData.PerformItemInteraction)) {
			this.inputTransaction = InputTransaction.read(this);
		}
		this.itemStackRequest = PlayerAuthItemStackRequest.read(
			this,
			0,
			this.inputData,
		);
		this.blockActions = PlayerBlockActions.read(this, 0, this.inputData);
		this.predictedVehicle = ClientPredictedVehicle.read(
			this,
			0,
			this.inputData,
		);
		this.analogueMotion = Vector2f.read(this);
		this.cameraOrientation = Vector3f.read(this);
		return this;
	}
}
