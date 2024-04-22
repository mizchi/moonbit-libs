import { js_string, spectest, flush, setMemory, readBuffer, writeBuffer } from "../.mooncakes/mizchi/js_io/mod.ts"
import { Item, decode, encode } from "../mod.ts";
import { expect } from "https://deno.land/std@0.214.0/expect/expect.ts";

const { instance } = await WebAssembly.instantiateStreaming(
  fetch(new URL("../target/wasm-gc/release/build/main/main.wasm", import.meta.url)),
  { js_string, spectest }
);

setMemory(instance.exports["moonbit.memory"] as WebAssembly.Memory);

const exports = instance.exports as any;
exports._start();

// TODO: Library API
function protocol<F extends (...args: Item[]) => Item = (...args: any[]) => any>(fun: () => void) {
  const f = (...args: Item[]) => {
    const encoded_input = encode(args);
    writeBuffer(encoded_input);
    fun();
    const buf = readBuffer();
    const decoded = decode(buf);
    return decoded;
  }
  return f as F;
}

const encodableTestPatterns = [
  [],
  [null],
  [1, 2, 3],
  [{}],
  [{ a: 1 }],
  [{ a: 1, b: 2 }],
  [{ a: 1, b: {} }],
  [{ nested: { a: 1, b: 2 } }],
  [[]],
  [[], []],
  [[1]],
  [[1, 2]],
  [{ a: [1, 2], b: [3, 4] }, { a: [5, 6], b: [7, 8] }],
  [{ a: { a: 1, b: 2 }, b: { a: 3, b: 4 } }, { a: { a: 5, b: 6 }, b: { a: 7, b: 8 } }],
  [true],
  [false],
  [1, null, true, false, "hello", { a: 1 }, [1, 2], { a: [1, 2] }]
]

Deno.test("reencode", () => {
  const reencode = protocol(exports.encode_again);
  for (const pattern of encodableTestPatterns) {
    const response = reencode(...pattern);
    console.log("[js:response]", response)
    expect(response).toEqual(pattern);
  }
  flush()
});
