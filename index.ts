import { encode } from "./rlp";

const ret = encode(["cat", "dog"]);

console.log(ret);
