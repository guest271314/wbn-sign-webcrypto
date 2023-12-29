/// <reference types="node" />
import { KeyObject } from "node:crypto";
import { ISigningStrategy } from "./signing-strategy-interface.js";
declare type SignatureAttributes = {
  [SignatureAttributeKey: string]: Uint8Array;
};
declare type IntegritySignature = {
  signatureAttributes: SignatureAttributes;
  signature: Uint8Array;
};
export declare class IntegrityBlockSigner {
  private readonly webBundle;
  private readonly signingStrategy;
  constructor(webBundle: Uint8Array, signingStrategy: ISigningStrategy);
  sign(): Promise<{
    integrityBlock: Uint8Array;
    signedWebBundle: Uint8Array;
  }>;
  readWebBundleLength(): number;
  obtainIntegrityBlock(): {
    integrityBlock: IntegrityBlock;
    offset: number;
  };
  calcWebBundleHash(): Uint8Array;
  generateDataToBeSigned(
    webBundleHash: Uint8Array,
    integrityBlockCborBytes: Uint8Array,
    newAttributesCborBytes: Uint8Array,
  ): Uint8Array;
  verifySignature(
    data: Uint8Array,
    signature: Uint8Array,
    publicKey: KeyObject,
  ): void;
}
export declare class IntegrityBlock {
  private readonly magic;
  private readonly version;
  private signatureStack;
  constructor();
  addIntegritySignature(is: IntegritySignature): void;
  toCBOR(): Uint8Array;
}
export {};
