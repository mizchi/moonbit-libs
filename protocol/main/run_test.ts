import { assert } from "https://deno.land/std@0.209.0/assert/assert.ts";
import { js_string, spectest, flush, setMemory } from "../.mooncakes/mizchi/js_io/dist/js_string.js"
import { js_io, stringToString, bytesToBytes } from "../.mooncakes/mizchi/js_io/dist/mod.js";
import { decode } from "../mod.ts";
import { expect } from "https://deno.land/std@0.214.0/expect/expect.ts";

// type IoLib = {
//   writeInputString(id: number, input: string): void;
// }

const { instance } = await WebAssembly.instantiateStreaming(
  fetch(new URL("../target/wasm-gc/release/build/main/main.wasm", import.meta.url)),
  { js_string, spectest, js_io }
);

setMemory(instance.exports["moonbit.memory"]);
const exports = instance.exports as any;
exports._start();

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
  const buf = write_struct(new Uint8Array([
    1, 2, 3
  ]));
  const decoded = decode(buf);
  expect(decoded).toEqual(["hello", 42]);
  flush()
});
