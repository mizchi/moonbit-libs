// cbor like binary format
import { expect } from "https://deno.land/std@0.214.0/expect/mod.ts";
import { decode, encode } from "./mod.ts";

Deno.test("encode int", () => {
  const input = 1;
  const encoded = encode(input);
  // console.log(encoded);
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
  // console.log(encoded);
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
  // console.log('float', encoded);
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
  // console.log(encoded);
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
