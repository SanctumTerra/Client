import { BinaryStream } from "@serenityjs/binarystream"

const stream = new BinaryStream()

stream.writeVarInt(2)
stream.writeVarString("");

const size = stream.readVarInt();
const string = stream.readVarString();

console.log(size)
console.log(string)
console.log(stream.getBufffer())
