import crypto from "crypto";
import { checkIsValidEd25519Key } from "../utils/utils.js";
// Class to be used when signing with parsed `crypto.KeyObject` private key
// provided directly in the constructor.
export class NodeCryptoSigningStrategy {
  privateKey;
  constructor(privateKey) {
    this.privateKey = privateKey;
    checkIsValidEd25519Key("private", privateKey);
  }
  async sign(data) {
    return crypto.sign(/*algorithm=*/ undefined, data, this.privateKey);
  }
  async getPublicKey() {
    return crypto.createPublicKey(this.privateKey);
  }
}
