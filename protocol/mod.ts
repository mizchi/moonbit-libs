// const 
enum DataType {
  String = 1,
  Int,
  Float,
  Boolean,
  Null,
  Array,
  Object,
}

type BinaryFormat = [
  dataType: DataType,
  ...number[]
];

export type Element = string | number | boolean | null | Array<Element> | { [key: string]: Element };

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function decode(buffer: Uint8Array): Element {
  const [part, _offset] = decodePart(buffer);
  return part
}

export function encode(item: Element): Uint8Array {
  return new Uint8Array(encodePart(item));
}

function intToBytes(value: number): Uint8Array {
  const buffer = new ArrayBuffer(4);
  const dataView = new DataView(buffer);
  dataView.setInt32(0, value | 0, true);
  return new Uint8Array(buffer);
}

function encodeLength(len: number): [len: number, ...number[]] {
  const buf = intToBytes(len);
  return [buf.byteLength, ...buf];
}

function encodeBoolean(value: boolean): BinaryFormat {
  console.log("encodeBoolean", value, value ? 1 : 0)
  return [DataType.Boolean, value ? 1 : 0]
}

function encodeNull(): BinaryFormat {
  return [DataType.Null]
}

function encodeInt(value: number): BinaryFormat {
  const buf = intToBytes(value);
  return [DataType.Int, ...encodeLength(buf.byteLength), ...buf]
}

function encodeFloatPart(value: number): BinaryFormat {
  const buffer = new ArrayBuffer(8);
  const dataView = new DataView(buffer);
  dataView.setFloat64(0, value, true);
  return [DataType.Float, ...encodeLength(dataView.byteLength), ...new Uint8Array(buffer)];
}

function encodeArray(part: Array<Element>): BinaryFormat {
  const len = part.length;
  const parts = part.map((i) => encodePart(i)).flat();
  return [DataType.Array, ...encodeLength(len), ...parts];
}

function encodeString(value: string): BinaryFormat {
  const encodedStr = encoder.encode(value);
  return [DataType.String, ...encodeLength(encodedStr.byteLength), ...encodedStr];
}

function encodeObject(value: Record<string, Element>): BinaryFormat {
  const keys = Object.keys(value);
  const keyCount = keys.length;
  const parts = keys.map((key) => {
    const encodedKey = encodeString(key);
    const encodedValue = encodePart(value[key]);
    return [...encodedKey, ...encodedValue];
  }).flat();
  return [DataType.Object, ...encodeLength(keyCount), ...parts];
}

function encodePart(part: Element): number[] {
  if (typeof part === 'object' && part !== null) {
    if (Array.isArray(part)) {
      return encodeArray(part);
    } else {
      return encodeObject(part);
    }
  } else if (typeof part === 'string') {
    return encodeString(part);
  } else if (part == null) {
    return encodeNull();
  } else if (typeof part === 'boolean') {
    return encodeBoolean(part);
  } else if (Number.isInteger(part) && typeof part === 'number') {
    return encodeInt(part as number)
  } else if (typeof part === 'number') {
    return encodeFloatPart(part)
  }
  throw new Error(`unknown element type: ${part}`)
}

function decodeLength(buffer: Uint8Array, offset: number): [len: number, offset: number] {
  const lenOfLen = buffer[offset++];
  const dataView = new DataView(buffer.buffer, offset, lenOfLen);
  return [dataView.getInt32(0, true), offset + dataView.byteLength];
}

function decodePart(buffer: Uint8Array, offset: number = 0): [Element, number] {
  // console.log("[decode:part]", DataType[buffer[offset]])

  const dataType = buffer[offset++];
  if (dataType === DataType.Boolean) {
    return [buffer[offset] == 1, offset + 1];
  }
  if (dataType === DataType.Null) {
    return [null, offset];
  }
  const [len, nextOffset] = decodeLength(buffer, offset);
  offset = nextOffset;
  if (dataType === DataType.Array) {
    const partCount = len;
    const parts: Element[] = [];
    for (let i = 0; i < partCount; i++) {
      const [decoded, end] = decodePart(buffer, offset);
      parts.push(decoded);
      offset = end;
    }
    return [parts, offset];
  }

  if (dataType === DataType.Object) {
    const result: { [key: string]: Element } = {};
    const keyCount = len;
    for (let i = 0; i < keyCount; i++) {
      const [key, keyEnd] = decodePart(buffer, offset);
      if (typeof key !== 'string') {
        throw new Error('key must be string')
      }
      offset = keyEnd;
      const [part, valueEnd] = decodePart(buffer, offset);
      result[key] = part;
      offset = valueEnd;
    }
    return [result, offset];
  }

  // const len = buffer[offset++];
  const end = offset + len;
  if (dataType === DataType.Boolean) {
    return [buffer[offset] === 1, end];
  }
  if (dataType === DataType.Null) {
    return [null, end];
  }
  if (dataType === DataType.String) {
    const encodedStr = buffer.slice(offset, offset + len);
    const str = decoder.decode(encodedStr);
    return [str, end];
  } else if (dataType === DataType.Int) {
    const dataView = new DataView(buffer.buffer, offset, len);
    return [dataView.getInt32(0, true), end];
  } else if (dataType === DataType.Float) {
    const dataView = new DataView(buffer.buffer, offset, len);
    return [dataView.getFloat64(0, true), end];
  }
  throw new Error(`unknown data type: ${dataType}`)
}
