export declare enum MajorType {
    PosInt = 0,
    NegInt = 1,
    ByteString = 2,
    Text = 3,
    Array = 4,
    Map = 5,
    Tag = 6,
    Other = 7
}
export declare function getMajorType(b: number): MajorType;
