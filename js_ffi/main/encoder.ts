const enum DataType {
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
  // ...len: ...IntFormat,
  ...number[]
];

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function intToBytes(value: number): Uint8Array {
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
  return [DataType.Boolean, value ? 1 : 0]
}

function encodeNull(): BinaryFormat {
  return [DataType.Null]
}

function encodeInt(value: number): BinaryFormat {
  const buf = intToBytes(value);
  return [DataType.Int, ...encodeLength(buf.byteLength), ...buf]
}

export function encodeFloat(value: number): Uint8Array {
  const buffer = new ArrayBuffer(8);
  const dataView = new DataView(buffer);
  dataView.setFloat64(0, value, true);
  return new Uint8Array(buffer);
}

export function decodeFloat(buf: Uint8Array): number {
  const dataView = new DataView(buf.buffer);
  return dataView.getFloat64(0, true)
}


function encodeFloatItem(value: number): BinaryFormat {
  const buffer = new ArrayBuffer(8);
  const dataView = new DataView(buffer);
  dataView.setFloat64(0, value, true);
  return [DataType.Float, ...encodeLength(dataView.byteLength), ...new Uint8Array(buffer)];
}

function encodeArray(item: Array<Item>): BinaryFormat {
  const len = item.length;
  const items = item.map((i) => encodeItem(i)).flat();
  return [DataType.Array, ...encodeLength(len), ...items];
}

function encodeString(value: string): BinaryFormat {
  const encodedStr = encoder.encode(value);
  return [DataType.String, ...encodeLength(encodedStr.byteLength), ...encodedStr];
}

function encodeObject(value: Record<string, Item>): BinaryFormat {
  const keys = Object.keys(value);
  const keyCount = keys.length;
  const items = keys.map((key) => {
    const encodedKey = encodeString(key);
    const encodedValue = encodeItem(value[key]);
    return [...encodedKey, ...encodedValue];
  }).flat();
  return [DataType.Object, ...encodeLength(keyCount), ...items];
}


type Item = string | number | boolean | null | Array<Item> | { [key: string]: Item };

export function encode(item: Item): Uint8Array {
  return new Uint8Array(encodeItem(item));
}

export function encodeItem(item: Item): number[] {
  if (typeof item === 'object' && item !== null) {
    if (Array.isArray(item)) {
      return encodeArray(item);
    } else {
      return encodeObject(item);
    }
  } else if (typeof item === 'string') {
    return encodeString(item);
  } else if (item == null) {
    return encodeNull();
  } else if (typeof item === 'boolean') {
    return encodeBoolean(item);
  } else if (Number.isInteger(item)) {
    return encodeInt(item)
  } else if (typeof item === 'number') {
    return encodeFloatItem(item)
  }
  throw new Error(`unknown item type: ${item}`)
}

function decodeLength(buffer: Uint8Array, offset: number): [len: number, offset: number] {
  const lenOfLen = buffer[offset++];
  const dataView = new DataView(buffer.buffer, offset, lenOfLen);
  return [dataView.getInt32(0, true), offset + dataView.byteLength];
}

export function decodeItem(buffer: Uint8Array, offset: number = 0): [Item, number] {
  const dataType = buffer[offset++];
  if (dataType === DataType.Boolean) {
    return [buffer[offset] === 1, offset + 1];
  }
  if (dataType === DataType.Null) {
    return [null, offset];
  }
  const [len, nextOffset] = decodeLength(buffer, offset);
  offset = nextOffset;
  if (dataType === DataType.Array) {
    const itemCount = len;
    const items: Item[] = [];
    for (let i = 0; i < itemCount; i++) {
      const [decoded, end] = decodeItem(buffer, offset);
      items.push(decoded);
      offset = end;
    }
    return [items, offset];
  }

  if (dataType === DataType.Object) {
    const result: { [key: string]: Item } = {};
    const keyCount = len;
    for (let i = 0; i < keyCount; i++) {
      const [key, keyEnd] = decodeItem(buffer, offset);
      if (typeof key !== 'string') {
        throw new Error('key must be string')
      }
      offset = keyEnd;
      const [item, valueEnd] = decodeItem(buffer, offset);
      result[key] = item;
      // items.push(decoded);
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

export function decode(buffer: Uint8Array): Item {
  const [decodedItem, _offset] = decodeItem(buffer);
  return decodedItem
}

// cbor like binary format
import { expect } from "https://deno.land/std@0.214.0/expect/mod.ts";
Deno.test("encode int", () => {
  const input = 1;
  const encoded = encode(input);
  const decoded = decode(encoded);
  expect(decoded).toBe(1);
});

Deno.test("encode null", () => {
  const input = null;
  const encoded = encode(input);
  const decoded = decode(encoded);
  expect(decoded).toBe(null);
});


Deno.test("encode int negative", () => {
  const input = -1;
  const encoded = encode(input);
  const decoded = decode(encoded);
  expect(decoded).toBe(input);
});


Deno.test("encode int over 255", () => {
  const input = 500;
  const encoded = encode(input);
  const decoded = decode(encoded);
  expect(decoded).toBe(input);
});

Deno.test("encode int over 65565", () => {
  const input = 80000;
  const encoded = encode(input);
  const decoded = decode(encoded);
  expect(decoded).toBe(input);
});

Deno.test("encode float", () => {
  const input = 3.14;
  const encoded = encode(input);
  const decoded = decode(encoded);
  expect(decoded).toBe(3.14);
});

Deno.test("encode string", () => {
  const input = "Hello";
  const encoded = encode(input);
  const decoded = decode(encoded);
  expect(decoded).toBe(input);
});

Deno.test("encode string over 256 length", () => {
  const input = "Hello".repeat(100);
  const encoded = encode(input);
  const decoded = decode(encoded);
  expect(decoded).toBe(input);
});


Deno.test("encode array 1", () => {
  const input = [4];
  const encoded = encode(input);
  const decoded = decode(encoded);
  expect(decoded).toEqual(input);
});

Deno.test("encode array 2", () => {
  const input = [1, 2];
  const encoded = encode(input);
  const decoded = decode(encoded);
  expect(decoded).toEqual(input);
});

Deno.test("encode array over 255", () => {
  const input = new Array(1000).fill(1);
  const encoded = encode(input);
  const decoded = decode(encoded);
  expect(decoded).toEqual(input);
});

Deno.test("encode array item", () => {
  const input = [1, "hello", 3.14];
  const encoded = encode(input);
  const decoded = decode(encoded);
  expect(decoded).toEqual(input);
});


Deno.test("encode nested array", () => {
  const input = [1, 2];
  const encoded = encode(input);
  const decoded = decode(encoded);
  expect(decoded).toEqual(input);
});

Deno.test("encode object", () => {
  const input = { a: 1 };
  const encoded = encode(input);
  const decoded = decode(encoded);
  expect(decoded).toEqual(input);
});

Deno.test("encode blank object", () => {
  const input = {};
  const encoded = encode(input);
  const decoded = decode(encoded);
  expect(decoded).toEqual(input);
});

Deno.test("encode object 2 keys", () => {
  const input = { a: 1, b: 2 };
  const encoded = encode(input);
  const decoded = decode(encoded);
  expect(decoded).toEqual(input);
});

Deno.test("encode object nested", () => {
  const input = { a: 1, b: { c: 1 } };
  const encoded = encode(input);
  const decoded = decode(encoded);
  expect(decoded).toEqual(input);
});

Deno.test("encode object complex", () => {
  const input = { a: 1, b: { c: [{ v: 1 }] } };
  const encoded = encode(input);
  const decoded = decode(encoded);
  expect(decoded).toEqual(input);
});

Deno.test("encode complex", () => {
  const input = [1, -1, 1.1, -1.1, null, true, false, "hello", { a: 1, b: { c: [{ v: 1 }] } }];
  const encoded = encode(input);
  const decoded = decode(encoded);
  expect(decoded).toEqual(input);
});
