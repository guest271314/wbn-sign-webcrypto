/// <reference types="node" />
import { KeyObject } from 'crypto';
export declare class WebBundleId {
    private readonly appIdSuffix;
    private readonly scheme;
    private readonly key;
    constructor(ed25519key: KeyObject);
    serialize(): string;
    serializeWithIsolatedWebAppOrigin(): string;
    toString(): string;
}
