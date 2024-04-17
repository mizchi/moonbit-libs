import { assert, } from "https://deno.land/std@0.209.0/assert/assert.ts";
import { expect } from "https://deno.land/std@0.214.0/expect/mod.ts";

enum DataType {
  String = 1,
  Int,
  Float,
  Array,
}

type BinaryFormat = [
  dataType: DataType,
  len: number,
  ...number[]
];

type ArrayBinaryFormat = [
  dataType: DataType.Array,
  len: number,
  itemCount: number,
  ...number[]
];

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function encodeInt(value: number): BinaryFormat {
  const buffer = new ArrayBuffer(4);
  const dataView = new DataView(buffer);
  dataView.setInt32(0, value);
  return [DataType.Int, dataView.byteLength, ...new Uint8Array(buffer)]
}

function encodeFloat(value: number): BinaryFormat {
  const buffer = new ArrayBuffer(8);
  const dataView = new DataView(buffer);
  dataView.setFloat64(0, value);
  return [DataType.Float, dataView.byteLength, ...new Uint8Array(buffer)];
}

function encodeString(value: string): BinaryFormat {
  const encodedStr = encoder.encode(value);
  return [DataType.String, encodedStr.byteLength, ...encodedStr];
}


// function encodeArray(arr: Array<string | number>): Uint8Array {
//   const encodedArr = encodeData(arr);
//   const len = encodedArr.byteLength;
//   const bytes = [DataType.Array, arr.length, len, ...encodedArr];
//   return 
// }

type Item = string | number | Array<Item>;

export function encode(item: Item): Uint8Array {
  return new Uint8Array(encodeItem(item));
}

export function encodeItem(item: Item): number[] {
  if (Array.isArray(item)) {
    const len = item.length;
    const items = item.map((i) => encodeItem(i)).flat();
    return [DataType.Array, len, ...items];
  } else if (typeof item === 'string') {
    return encodeString(item);
  } else if (Number.isInteger(item)) {
    return encodeInt(item)
  } else if (typeof item === 'number') {
    return encodeFloat(item)
  }
  throw new Error(`unknown item type: ${item}`)
}

export function decodeItem(buffer: Uint8Array, offset: number = 0): [Item, number] {
  // let offset = 0;
  const dataType = buffer[offset++];
  console.log("[parsing]", { dataType: DataType[dataType] })

  if (dataType === DataType.Array) {
    const itemCount = buffer[offset++];
    const items: Item[] = [];
    for (let i = 0; i < itemCount; i++) {
      console.log('child sliced:', buffer.slice(offset))
      const [decoded, childLen] = decodeItem(buffer, offset);
      items.push(decoded);
      offset = childLen;
    }
    return [items, offset];
  }

  const len = buffer[offset++];
  if (dataType === DataType.String) {
    const encodedStr = buffer.slice(offset, offset + len);
    const str = decoder.decode(encodedStr);
    return [str, offset + len];
  } else if (dataType === DataType.Int) {
    const dataView = new DataView(buffer.buffer, offset, len);
    return [dataView.getInt32(0), offset + len];
  } else if (dataType === DataType.Float) {
    const dataView = new DataView(buffer.buffer, offset, len);
    return [dataView.getFloat64(0), offset + len];
  }
  throw new Error(`unknown data type: ${dataType}`)
}

export function decode(buffer: Uint8Array): Item {
  const [decodedItem, _offset] = decodeItem(buffer);
  return decodedItem
}

Deno.test("encode int", () => {
  const input = 1;
  const encoded = encode(input);
  const decoded = decode(encoded);
  expect(decoded).toBe(1);
});

Deno.test("encode float", () => {
  const input = 3.14;
  const encoded = encode(input);
  const decoded = decode(encoded);
  // assert(decoded === 3.14);
  expect(decoded).toBe(3.14);
});

Deno.test("encode string", () => {
  const input = "Hello";
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