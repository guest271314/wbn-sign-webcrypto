"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/mute-stream/lib/index.js
var require_lib = __commonJS({
  "node_modules/mute-stream/lib/index.js"(exports, module2) {
    var Stream = require("stream");
    var MuteStream = class extends Stream {
      #isTTY = null;
      constructor(opts = {}) {
        super(opts);
        this.writable = this.readable = true;
        this.muted = false;
        this.on("pipe", this._onpipe);
        this.replace = opts.replace;
        this._prompt = opts.prompt || null;
        this._hadControl = false;
      }
      #destSrc(key, def) {
        if (this._dest) {
          return this._dest[key];
        }
        if (this._src) {
          return this._src[key];
        }
        return def;
      }
      #proxy(method, ...args) {
        if (typeof this._dest?.[method] === "function") {
          this._dest[method](...args);
        }
        if (typeof this._src?.[method] === "function") {
          this._src[method](...args);
        }
      }
      get isTTY() {
        if (this.#isTTY !== null) {
          return this.#isTTY;
        }
        return this.#destSrc("isTTY", false);
      }
      set isTTY(val) {
        this.#isTTY = val;
      }
      get rows() {
        return this.#destSrc("rows");
      }
      get columns() {
        return this.#destSrc("columns");
      }
      mute() {
        this.muted = true;
      }
      unmute() {
        this.muted = false;
      }
      _onpipe(src) {
        this._src = src;
      }
      pipe(dest, options) {
        this._dest = dest;
        return super.pipe(dest, options);
      }
      pause() {
        if (this._src) {
          return this._src.pause();
        }
      }
      resume() {
        if (this._src) {
          return this._src.resume();
        }
      }
      write(c) {
        if (this.muted) {
          if (!this.replace) {
            return true;
          }
          if (c.match(/^\u001b/)) {
            if (c.indexOf(this._prompt) === 0) {
              c = c.slice(this._prompt.length);
              c = c.replace(/./g, this.replace);
              c = this._prompt + c;
            }
            this._hadControl = true;
            return this.emit("data", c);
          } else {
            if (this._prompt && this._hadControl && c.indexOf(this._prompt) === 0) {
              this._hadControl = false;
              this.emit("data", this._prompt);
              c = c.slice(this._prompt.length);
            }
            c = c.toString().replace(/./g, this.replace);
          }
        }
        this.emit("data", c);
      }
      end(c) {
        if (this.muted) {
          if (c && this.replace) {
            c = c.toString().replace(/./g, this.replace);
          } else {
            c = null;
          }
        }
        if (c) {
          this.emit("data", c);
        }
        this.emit("end");
      }
      destroy(...args) {
        return this.#proxy("destroy", ...args);
      }
      destroySoon(...args) {
        return this.#proxy("destroySoon", ...args);
      }
      close(...args) {
        return this.#proxy("close", ...args);
      }
    };
    module2.exports = MuteStream;
  }
});

// node_modules/read/lib/read.js
var require_read = __commonJS({
  "node_modules/read/lib/read.js"(exports, module2) {
    var readline = require("readline");
    var Mute = require_lib();
    module2.exports = async function read2({
      default: def = "",
      input = process.stdin,
      output = process.stdout,
      prompt = "",
      silent,
      timeout,
      edit,
      terminal,
      replace
    }) {
      if (typeof def !== "undefined" && typeof def !== "string" && typeof def !== "number") {
        throw new Error("default value must be string or number");
      }
      let editDef = false;
      prompt = prompt.trim() + " ";
      terminal = !!(terminal || output.isTTY);
      if (def) {
        if (silent) {
          prompt += "(<default hidden>) ";
        } else if (edit) {
          editDef = true;
        } else {
          prompt += "(" + def + ") ";
        }
      }
      const m = new Mute({ replace, prompt });
      m.pipe(output, { end: false });
      output = m;
      return new Promise((resolve, reject) => {
        const rl = readline.createInterface({ input, output, terminal });
        const timer = timeout && setTimeout(() => onError(new Error("timed out")), timeout);
        output.unmute();
        rl.setPrompt(prompt);
        rl.prompt();
        if (silent) {
          output.mute();
        } else if (editDef) {
          rl.line = def;
          rl.cursor = def.length;
          rl._refreshLine();
        }
        const done = () => {
          rl.close();
          clearTimeout(timer);
          output.mute();
          output.end();
        };
        const onError = (er) => {
          done();
          reject(er);
        };
        rl.on("error", onError);
        rl.on("line", (line) => {
          if (silent && terminal) {
            output.unmute();
            output.write("\r\n");
          }
          done();
          const res = line.replace(/\r?\n$/, "") || def || "";
          return resolve(res);
        });
        rl.on("SIGINT", () => {
          rl.close();
          onError(new Error("canceled"));
        });
      });
    };
  }
});

// src/wbn-sign.ts
var wbn_sign_exports = {};
__export(wbn_sign_exports, {
  IntegrityBlock: () => IntegrityBlock,
  IntegrityBlockSigner: () => IntegrityBlockSigner,
  NodeCryptoSigningStrategy: () => NodeCryptoSigningStrategy,
  WebBundleId: () => WebBundleId,
  getRawPublicKey: () => getRawPublicKey,
  parsePemKey: () => parsePemKey,
  readPassphrase: () => readPassphrase
});
module.exports = __toCommonJS(wbn_sign_exports);

// src/signers/node-crypto-signing-strategy.ts
var import_crypto2 = __toESM(require("crypto"), 1);

// src/utils/utils.ts
var import_crypto = __toESM(require("crypto"), 1);
var import_read = __toESM(require_read(), 1);
async function readPassphrase() {
  try {
    const passphrase = await (0, import_read.default)({
      prompt: "Passphrase for the key: ",
      silent: true,
      replace: "*",
      output: process.stderr
    });
    return passphrase;
  } catch (er) {
    throw new Error("Reading passphrase failed.");
  }
}
function parsePemKey(unparsedKey, passphrase) {
  return import_crypto.default.createPrivateKey({
    key: unparsedKey,
    passphrase
  });
}
function getRawPublicKey(publicKey) {
  return new Uint8Array(
    publicKey.export({ type: "spki", format: "der" }).slice(-32)
  );
}
function checkIsValidEd25519Key(expectedKeyType, key) {
  if (key.type !== expectedKeyType) {
    throw new Error(
      `Expected key type to be ${expectedKeyType}, but it was "${key.type}".`
    );
  }
  if (key.asymmetricKeyType !== "ed25519") {
    throw new Error(
      `Expected asymmetric key type to be "ed25519", but it was "${key.asymmetricKeyType}".`
    );
  }
}

// src/signers/node-crypto-signing-strategy.ts
var NodeCryptoSigningStrategy = class {
  constructor(privateKey) {
    this.privateKey = privateKey;
    checkIsValidEd25519Key("private", privateKey);
  }
  async sign(data) {
    return import_crypto2.default.sign(void 0, data, this.privateKey);
  }
  async getPublicKey() {
    return import_crypto2.default.createPublicKey(this.privateKey);
  }
};

// src/signers/integrity-block-signer.ts
var import_crypto3 = __toESM(require("crypto"), 1);
var cborg = __toESM(require("cborg"), 1);

// src/utils/constants.ts
var ED25519_PK_SIGNATURE_ATTRIBUTE_NAME = "ed25519PublicKey";
var INTEGRITY_BLOCK_MAGIC = new Uint8Array([
  240,
  159,
  150,
  139,
  240,
  159,
  147,
  166
]);
var VERSION_B1 = new Uint8Array([49, 98, 0, 0]);

// src/cbor/additionalinfo.ts
function convertToAdditionalInfo(b) {
  switch (b & 31) {
    case 24:
      return 1 /* OneByte */;
    case 25:
      return 2 /* TwoBytes */;
    case 26:
      return 3 /* FourBytes */;
    case 27:
      return 4 /* EightBytes */;
    case 28:
    case 29:
    case 30:
      throw new Error("Reserved is not used in deterministic CBOR.");
    case 31:
      throw new Error("Indefinite is not used in deterministic CBOR.");
    default:
      return 0 /* Direct */;
  }
}
function getAdditionalInfoDirectValue(b) {
  return b & 31;
}
function getAdditionalInfoLength(info) {
  switch (info) {
    case 0 /* Direct */:
      return 0;
    case 1 /* OneByte */:
      return 1;
    case 2 /* TwoBytes */:
      return 2;
    case 3 /* FourBytes */:
      return 4;
    case 4 /* EightBytes */:
      return 8;
    default:
      throw new Error(`${info} is not supported.`);
  }
}
function getAdditionalInfoValueLowerLimit(info) {
  switch (info) {
    case 0 /* Direct */:
      return 0n;
    case 1 /* OneByte */:
      return 24n;
    case 2 /* TwoBytes */:
      return 256n;
    case 3 /* FourBytes */:
      return 65536n;
    case 4 /* EightBytes */:
      return 4294967296n;
    default:
      throw new Error(`Invalid additional information value: ${info}`);
  }
}

// src/cbor/majortype.ts
function getMajorType(b) {
  return (b & 255) >> 5;
}

// src/cbor/deterministic.ts
function checkDeterministic(input) {
  let index = 0;
  while (index < input.length) {
    index += deterministicRec(input, index);
  }
  if (index > input.length) {
    throw new Error(
      `Last CBOR item was incomplete. Index ${index} out of bounds of input of length ${input.length}`
    );
  }
}
function deterministicRec(input, index) {
  const b = input[index];
  switch (getMajorType(b)) {
    case 0 /* PosInt */:
      const { lengthInBytes } = unsignedIntegerDeterministic(input, index);
      return lengthInBytes + 1;
    case 2 /* ByteString */:
    case 3 /* Text */:
      return textOrByteStringDeterministic(input, index) + 1;
    case 4 /* Array */:
      return arrayDeterministic(input, index);
    case 5 /* Map */:
      return mapDeterministic(input, index);
    default:
      throw new Error("Missing implementation for a major type.");
  }
}
function unsignedIntegerDeterministic(input, index) {
  const info = convertToAdditionalInfo(input[index]);
  const lengthInBytes = getAdditionalInfoLength(info);
  const value = getUnsignedIntegerValue(
    input.slice(index, index + lengthInBytes + 1),
    info
  );
  if (value < getAdditionalInfoValueLowerLimit(info)) {
    throw new Error(
      `${value} should not be represented with ${lengthInBytes} bytes in deterministic CBOR.`
    );
  }
  return { lengthInBytes, value };
}
function getUnsignedIntegerValue(input, info) {
  const offset = 1;
  switch (info) {
    case 0 /* Direct */:
      return BigInt(getAdditionalInfoDirectValue(input[0]));
    case 1 /* OneByte */:
      return BigInt(Buffer.from(input).readUInt8(offset));
    case 2 /* TwoBytes */:
      return BigInt(Buffer.from(input).readUInt16BE(offset));
    case 3 /* FourBytes */:
      return BigInt(Buffer.from(input).readUInt32BE(offset));
    case 4 /* EightBytes */:
      return Buffer.from(input).readBigUInt64BE(offset);
    default:
      throw new Error(`${info} is not supported.`);
  }
}
function textOrByteStringDeterministic(input, index) {
  const { lengthInBytes, value } = unsignedIntegerDeterministic(input, index);
  const totalLength = lengthInBytes + Number(value);
  if (totalLength >= input.length - index) {
    throw new Error(
      "Text or byte string's length cannot exceed the number of bytes left on the input array."
    );
  }
  return totalLength;
}
function arrayDeterministic(input, index) {
  const { lengthInBytes, value } = unsignedIntegerDeterministic(input, index);
  let startIndexOfNextElement = index + 1 + lengthInBytes;
  for (var i = 0; i < Number(value); i++) {
    if (startIndexOfNextElement >= input.length) {
      throw new Error(
        "Number of items on CBOR array is less than the number of items it claims."
      );
    }
    startIndexOfNextElement += deterministicRec(input, startIndexOfNextElement);
  }
  return startIndexOfNextElement - index;
}
function mapDeterministic(input, index) {
  const { lengthInBytes, value } = unsignedIntegerDeterministic(input, index);
  let startIndexOfNextElement = index + 1 + lengthInBytes;
  let lastSeenKey = new Uint8Array();
  for (var mapItemIndex = 0; mapItemIndex < Number(value) * 2; mapItemIndex++) {
    if (startIndexOfNextElement >= input.length) {
      throw new Error(
        "Number of items on CBOR map is less than the number of items it claims."
      );
    }
    const itemLength = deterministicRec(input, startIndexOfNextElement);
    if (mapItemIndex % 2 == 0) {
      const keyCborBytes = input.slice(
        startIndexOfNextElement,
        startIndexOfNextElement + itemLength
      );
      const ordering = Buffer.compare(lastSeenKey, keyCborBytes);
      if (ordering == 0) {
        throw new Error("CBOR map contains duplicate keys.");
      } else if (ordering > 0) {
        throw new Error("CBOR map keys are not in lexicographical order.");
      }
      lastSeenKey = keyCborBytes;
    }
    startIndexOfNextElement += itemLength;
  }
  return startIndexOfNextElement - index;
}

// src/signers/integrity-block-signer.ts
var IntegrityBlockSigner = class {
  constructor(webBundle, signingStrategy) {
    this.webBundle = webBundle;
    this.signingStrategy = signingStrategy;
  }
  async sign() {
    const integrityBlock = this.obtainIntegrityBlock().integrityBlock;
    const publicKey = await this.signingStrategy.getPublicKey();
    checkIsValidEd25519Key("public", publicKey);
    const newAttributes = {
      [ED25519_PK_SIGNATURE_ATTRIBUTE_NAME]: getRawPublicKey(publicKey)
    };
    const ibCbor = integrityBlock.toCBOR();
    const attrCbor = cborg.encode(newAttributes);
    checkDeterministic(ibCbor);
    checkDeterministic(attrCbor);
    const dataToBeSigned = this.generateDataToBeSigned(
      this.calcWebBundleHash(),
      ibCbor,
      attrCbor
    );
    const signature = await this.signingStrategy.sign(dataToBeSigned);
    this.verifySignature(dataToBeSigned, signature, publicKey);
    integrityBlock.addIntegritySignature({
      signature,
      signatureAttributes: newAttributes
    });
    const signedIbCbor = integrityBlock.toCBOR();
    checkDeterministic(signedIbCbor);
    return {
      integrityBlock: signedIbCbor,
      signedWebBundle: new Uint8Array(
        Buffer.concat([signedIbCbor, this.webBundle])
      )
    };
  }
  readWebBundleLength() {
    let buffer = Buffer.from(this.webBundle.slice(-8));
    return Number(buffer.readBigUint64BE());
  }
  obtainIntegrityBlock() {
    const webBundleLength = this.readWebBundleLength();
    if (webBundleLength !== this.webBundle.length) {
      throw new Error(
        "IntegrityBlockSigner: Re-signing signed bundles is not supported yet."
      );
    }
    return { integrityBlock: new IntegrityBlock(), offset: 0 };
  }
  calcWebBundleHash() {
    var hash = import_crypto3.default.createHash("sha512");
    var data = hash.update(this.webBundle);
    return new Uint8Array(data.digest());
  }
  generateDataToBeSigned(webBundleHash, integrityBlockCborBytes, newAttributesCborBytes) {
    const dataParts = [
      webBundleHash,
      integrityBlockCborBytes,
      newAttributesCborBytes
    ];
    const bigEndianNumLength = 8;
    const totalLength = dataParts.reduce((previous, current) => {
      return previous + current.length;
    }, dataParts.length * bigEndianNumLength);
    let buffer = Buffer.alloc(totalLength);
    let offset = 0;
    dataParts.forEach((d) => {
      buffer.writeBigInt64BE(BigInt(d.length), offset);
      offset += bigEndianNumLength;
      Buffer.from(d).copy(buffer, offset);
      offset += d.length;
    });
    return new Uint8Array(buffer);
  }
  verifySignature(data, signature, publicKey) {
    const isVerified = import_crypto3.default.verify(
      void 0,
      data,
      publicKey,
      signature
    );
    if (!isVerified) {
      throw new Error(
        "IntegrityBlockSigner: Signature cannot be verified. Your keys might be corrupted or not corresponding each other."
      );
    }
  }
};
var IntegrityBlock = class {
  magic = INTEGRITY_BLOCK_MAGIC;
  version = VERSION_B1;
  signatureStack = [];
  constructor() {
  }
  addIntegritySignature(is) {
    this.signatureStack.unshift(is);
  }
  toCBOR() {
    return cborg.encode([
      this.magic,
      this.version,
      this.signatureStack.map((integritySig) => {
        return [integritySig.signatureAttributes, integritySig.signature];
      })
    ]);
  }
};

// src/web-bundle-id.ts
var import_crypto4 = __toESM(require("crypto"), 1);

// node_modules/to-data-view/index.js
function toDataView(data) {
  if (data instanceof Int8Array || data instanceof Uint8Array || data instanceof Uint8ClampedArray) {
    return new DataView(data.buffer, data.byteOffset, data.byteLength);
  }
  if (data instanceof ArrayBuffer) {
    return new DataView(data);
  }
  throw new TypeError("Expected `data` to be an ArrayBuffer, Buffer, Int8Array, Uint8Array or Uint8ClampedArray");
}

// node_modules/base32-encode/index.js
var RFC4648 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
var RFC4648_HEX = "0123456789ABCDEFGHIJKLMNOPQRSTUV";
var CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
function base32Encode(data, variant, options) {
  options = options || {};
  let alphabet, defaultPadding;
  switch (variant) {
    case "RFC3548":
    case "RFC4648":
      alphabet = RFC4648;
      defaultPadding = true;
      break;
    case "RFC4648-HEX":
      alphabet = RFC4648_HEX;
      defaultPadding = true;
      break;
    case "Crockford":
      alphabet = CROCKFORD;
      defaultPadding = false;
      break;
    default:
      throw new Error("Unknown base32 variant: " + variant);
  }
  const padding = options.padding !== void 0 ? options.padding : defaultPadding;
  const view = toDataView(data);
  let bits = 0;
  let value = 0;
  let output = "";
  for (let i = 0; i < view.byteLength; i++) {
    value = value << 8 | view.getUint8(i);
    bits += 8;
    while (bits >= 5) {
      output += alphabet[value >>> bits - 5 & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += alphabet[value << 5 - bits & 31];
  }
  if (padding) {
    while (output.length % 8 !== 0) {
      output += "=";
    }
  }
  return output;
}

// src/web-bundle-id.ts
var WebBundleId = class {
  appIdSuffix = [0, 1, 2];
  scheme = "isolated-app://";
  key;
  constructor(ed25519key) {
    if (ed25519key.asymmetricKeyType !== "ed25519") {
      throw new Error(
        `WebBundleId: Only ed25519 keys are currently supported. Your key's type is ${ed25519key.asymmetricKeyType}.`
      );
    }
    if (ed25519key.type === "private") {
      this.key = import_crypto4.default.createPublicKey(ed25519key);
    } else {
      this.key = ed25519key;
    }
  }
  serialize() {
    return base32Encode(
      new Uint8Array([...getRawPublicKey(this.key), ...this.appIdSuffix]),
      "RFC4648",
      { padding: false }
    ).toLowerCase();
  }
  serializeWithIsolatedWebAppOrigin() {
    return `${this.scheme}${this.serialize()}/`;
  }
  toString() {
    return `  Web Bundle ID: ${this.serialize()}
  Isolated Web App Origin: ${this.serializeWithIsolatedWebAppOrigin()}`;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  IntegrityBlock,
  IntegrityBlockSigner,
  NodeCryptoSigningStrategy,
  WebBundleId,
  getRawPublicKey,
  parsePemKey,
  readPassphrase
});
