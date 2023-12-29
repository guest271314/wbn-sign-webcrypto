import crypto from 'crypto';
import * as cborg from 'cborg';
import { ED25519_PK_SIGNATURE_ATTRIBUTE_NAME, INTEGRITY_BLOCK_MAGIC, VERSION_B1, } from '../utils/constants.js';
import { checkDeterministic } from '../cbor/deterministic.js';
import { getRawPublicKey, checkIsValidEd25519Key } from '../utils/utils.js';
export class IntegrityBlockSigner {
    webBundle;
    signingStrategy;
    constructor(webBundle, signingStrategy) {
        this.webBundle = webBundle;
        this.signingStrategy = signingStrategy;
    }
    async sign() {
        const integrityBlock = this.obtainIntegrityBlock().integrityBlock;
        const publicKey = await this.signingStrategy.getPublicKey();
        checkIsValidEd25519Key('public', publicKey);
        const newAttributes = {
            [ED25519_PK_SIGNATURE_ATTRIBUTE_NAME]: getRawPublicKey(publicKey),
        };
        const ibCbor = integrityBlock.toCBOR();
        const attrCbor = cborg.encode(newAttributes);
        checkDeterministic(ibCbor);
        checkDeterministic(attrCbor);
        const dataToBeSigned = this.generateDataToBeSigned(this.calcWebBundleHash(), ibCbor, attrCbor);
        const signature = await this.signingStrategy.sign(dataToBeSigned);
        this.verifySignature(dataToBeSigned, signature, publicKey);
        integrityBlock.addIntegritySignature({
            signature,
            signatureAttributes: newAttributes,
        });
        const signedIbCbor = integrityBlock.toCBOR();
        checkDeterministic(signedIbCbor);
        return {
            integrityBlock: signedIbCbor,
            signedWebBundle: new Uint8Array(Buffer.concat([signedIbCbor, this.webBundle])),
        };
    }
    readWebBundleLength() {
        // The length of the web bundle is contained in the last 8 bytes of the web
        // bundle, represented as BigEndian.
        let buffer = Buffer.from(this.webBundle.slice(-8));
        // Number is big enough to represent 4GB which is the limit for the web
        // bundle size which can be contained in a Buffer, which is the format
        // in which it's passed back to e.g. Webpack.
        return Number(buffer.readBigUint64BE());
    }
    obtainIntegrityBlock() {
        const webBundleLength = this.readWebBundleLength();
        if (webBundleLength !== this.webBundle.length) {
            throw new Error('IntegrityBlockSigner: Re-signing signed bundles is not supported yet.');
        }
        return { integrityBlock: new IntegrityBlock(), offset: 0 };
    }
    calcWebBundleHash() {
        var hash = crypto.createHash('sha512');
        var data = hash.update(this.webBundle);
        return new Uint8Array(data.digest());
    }
    generateDataToBeSigned(webBundleHash, integrityBlockCborBytes, newAttributesCborBytes) {
        // The order is critical and must be the following:
        // (0) hash of the bundle,
        // (1) integrity block, and
        // (2) attributes.
        const dataParts = [
            webBundleHash,
            integrityBlockCborBytes,
            newAttributesCborBytes,
        ];
        const bigEndianNumLength = 8;
        const totalLength = dataParts.reduce((previous, current) => {
            return previous + current.length;
        }, /*one big endian num per part*/ dataParts.length * bigEndianNumLength);
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
        const isVerified = crypto.verify(
        /*algorithm=*/ undefined, data, publicKey, signature);
        if (!isVerified) {
            throw new Error('IntegrityBlockSigner: Signature cannot be verified. Your keys might be corrupted or not corresponding each other.');
        }
    }
}
export class IntegrityBlock {
    magic = INTEGRITY_BLOCK_MAGIC;
    version = VERSION_B1;
    signatureStack = [];
    constructor() { }
    addIntegritySignature(is) {
        this.signatureStack.unshift(is);
    }
    toCBOR() {
        return cborg.encode([
            this.magic,
            this.version,
            this.signatureStack.map((integritySig) => {
                // The CBOR must have an array of length 2 containing the following:
                // (0) attributes and (1) signature. The order is important.
                return [integritySig.signatureAttributes, integritySig.signature];
            }),
        ]);
    }
}
