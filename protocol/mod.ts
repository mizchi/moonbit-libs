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
  ...number[]
];

export type Item = string | number | boolean | null | Array<Item> | { [key: string]: Item };

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function decode(buffer: Uint8Array): Item {
  const [decodedItem, _offset] = decodeItem(buffer);
  return decodedItem
}

export function encode(item: Item): Uint8Array {
  return new Uint8Array(encodeItem(item));
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

function encodeItem(item: Item): number[] {
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
  } else if (Number.isInteger(item) && typeof item === 'number') {
    return encodeInt(item as number)
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

function decodeItem(buffer: Uint8Array, offset: number = 0): [Item, number] {
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

