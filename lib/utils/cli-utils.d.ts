/// <reference types="node" />
/// <reference types="node" />
import { KeyObject } from "crypto";
export declare function parseMaybeEncryptedKey(
  privateKeyFile: Buffer,
): Promise<KeyObject>;
export declare function greenConsoleLog(text: string): void;
