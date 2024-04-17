import { assert } from "https://deno.land/std@0.209.0/assert/assert.ts";
import { js_string, spectest, flush, setMemory } from "../.mooncakes/mizchi/js_io/js_string.ts"
import { js_io, stringToString, bytesToBytes } from "../.mooncakes/mizchi/js_io/mod.ts";
import { Item, decode, encode } from "../mod.ts";
import { expect } from "https://deno.land/std@0.214.0/expect/expect.ts";

const { instance } = await WebAssembly.instantiateStreaming(
  fetch(new URL("../target/wasm-gc/release/build/main/main.wasm", import.meta.url)),
  { js_string, spectest, js_io }
);

// @ts-ignore xxx
setMemory(instance.exports["moonbit.memory"]);
const exports = instance.exports as any;
exports._start();

// TODO: Library API
function protocolToProtocol<F extends (...args: Item[]) => Item = (...args: any[]) => any>(fun: (id: number) => void) {
  const pfun = bytesToBytes(fun);
  const f = (...args: Item[]) => {
    const encoded_input = encode(args);
    const buf = pfun(encoded_input);
    return decode(buf);
  }
  return f as F;
}

// remote write
Deno.test("remote echo", () => {
  const echo = stringToString(exports.echo);
  const result = echo("Hello");
  assert(result === "echo Hello")
  flush()
});

// remote write
Deno.test("remote echo_bytes", () => {
  const echoBytes = bytesToBytes(exports.echo_bytes);
  const bytes = new TextEncoder().encode("Hello");
  const result = echoBytes(bytes);
  assert(new TextDecoder().decode(result) === "Hello")
  flush()
});

Deno.test("remote write_struct", () => {
  const write_struct = bytesToBytes(exports.write_struct);

  const encoded_input = encode([42]);

  const buf = write_struct(encoded_input);
  const decoded = decode(buf);
  expect(decoded).toEqual(["hello", 42]);
  flush()
});

Deno.test("remote handle_struct_input", () => {
  const handle_struct_input = bytesToBytes(exports.handle_struct_input);

  const input = {
    items: [1, 2, 3],
    str: "hello",
  }
  const encoded_input = encode(input);

  const buf = handle_struct_input(encoded_input);
  const decoded = decode(buf);
  expect(decoded).toEqual(input);
  flush()
});

const encodeTestPatterns = [
  [1, 2, 3],
  [{ a: 1, b: 2 }, { a: 3, b: 4 }],
  [[1, 2], [3, 4]],
  [{ a: [1, 2], b: [3, 4] }, { a: [5, 6], b: [7, 8] }],
  [{ a: { a: 1, b: 2 }, b: { a: 3, b: 4 } }, { a: { a: 5, b: 6 }, b: { a: 7, b: 8 } }],
  [true],
  [false],
  [1, null, true, false, "hello", { a: 1 }, [1, 2], { a: [1, 2] }]
]

Deno.test("re-encode", () => {
  const encode_again = protocolToProtocol(exports.encode_again);
  for (const pattern of encodeTestPatterns) {
    const response = encode_again(...pattern);
    expect(response).toEqual(pattern);
  }
  flush()
});
