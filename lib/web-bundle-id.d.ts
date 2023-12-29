/// <reference types="node" />
import { KeyObject } from "node:crypto";
export declare class WebBundleId {
  private readonly appIdSuffix;
  private readonly scheme;
  private readonly key;
  constructor(ed25519key: KeyObject);
  serialize(): string;
  serializeWithIsolatedWebAppOrigin(): string;
  toString(): string;
}
