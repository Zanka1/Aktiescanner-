declare const process: {
  env: Record<string, string | undefined>;
};

declare class Buffer extends Uint8Array {
  static from(arrayBuffer: ArrayBuffer | ArrayLike<number> | string, byteOffset?: number, length?: number): Buffer;
}

declare const Buffer: typeof globalThis.Buffer;
