/// <reference types="node" />
import { KeyObject } from "crypto";
export interface ISigningStrategy {
  sign(data: Uint8Array): Promise<Uint8Array>;
  getPublicKey(): Promise<KeyObject>;
}
