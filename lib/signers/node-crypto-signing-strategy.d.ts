/// <reference types="node" />
import { KeyObject } from 'crypto';
import { ISigningStrategy } from './signing-strategy-interface.js';
export declare class NodeCryptoSigningStrategy implements ISigningStrategy {
    private readonly privateKey;
    constructor(privateKey: KeyObject);
    sign(data: Uint8Array): Promise<Uint8Array>;
    getPublicKey(): Promise<KeyObject>;
}
