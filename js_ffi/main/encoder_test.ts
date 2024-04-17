// cbor like binary format
import { expect } from "https://deno.land/std@0.214.0/expect/mod.ts";
import { decode, encode, intToBytes, encodeFloat } from "./encoder.ts";

Deno.test("encode_float", () => {
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  view.setFloat64(0, 3.14, true);
  // console.log('enc', new Uint8Array(buf));
  // const expected = new Uint8Array(buf);
  // const bytes = encodeFloat(3.14);
  const decoded = new DataView(buf).getFloat64(0, true);
  expect(decoded).toBe(3.14);
  // console.log(bytes);
  console.log(decoded);

  // expect(bytes).toEqual(new Uint8Array([0, 0, 0, 1]));
});

Deno.test("int_to_bytes", () => {
  const bytes = intToBytes(1);
  expect(bytes).toEqual(new Uint8Array([1, 0, 0, 0]));
});

Deno.test("int_to_bytes", () => {
  const bytes = intToBytes(-1);
  expect(bytes).toEqual(new Uint8Array([255, 255, 255, 255]));
});

Deno.test("int_to_bytes", () => {
  const bytes = intToBytes(-2);
  expect(bytes).toEqual(new Uint8Array([254, 255, 255, 255]));
});

Deno.test("encode int", () => {
  const input = 1;
  const encoded = encode(input);
  console.log(encoded);
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
  console.log(encoded);
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
  console.log('float', encoded);
  const decoded = decode(encoded);
  expect(decoded).toBe(3.14);
});

Deno.test("encode string", () => {
  const input = "Hello";
  const encoded = encode(input);
  const decoded = decode(encoded);
  expect(decoded).toBe(input);
});

Deno.test("encode string multibyte", () => {
  const input = "こんにちは";
  const encoded = encode(input);
  console.log(encoded);
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
