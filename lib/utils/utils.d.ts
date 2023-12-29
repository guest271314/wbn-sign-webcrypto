/// <reference types="node" />
/// <reference types="node" />
import crypto, { KeyObject } from "crypto";
export declare function readPassphrase(): Promise<string>;
export declare function parsePemKey(
  unparsedKey: Buffer,
  passphrase?: string,
): KeyObject;
export declare function getRawPublicKey(
  publicKey: crypto.KeyObject,
): Uint8Array;
export declare function checkIsValidEd25519Key(
  expectedKeyType: crypto.KeyObjectType,
  key: KeyObject,
): void;
