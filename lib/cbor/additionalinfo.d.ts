export declare enum AdditionalInfo {
    Direct = 0,
    OneByte = 1,
    TwoBytes = 2,
    FourBytes = 3,
    EightBytes = 4,
    Reserved = 5,
    Indefinite = 6
}
export declare function convertToAdditionalInfo(b: number): AdditionalInfo;
export declare function getAdditionalInfoDirectValue(b: number): number;
export declare function getAdditionalInfoLength(info: AdditionalInfo): number;
export declare function getAdditionalInfoValueLowerLimit(info: AdditionalInfo): bigint;
