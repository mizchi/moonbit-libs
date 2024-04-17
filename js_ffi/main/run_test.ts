import { assert } from "https://deno.land/std@0.209.0/assert/assert.ts";
import { js_string, spectest, flush, setMemory } from "../.mooncakes/mizchi/js_io/dist/js_string.js"
import { js_io } from "../.mooncakes/mizchi/js_io/dist/mod.js";

const { instance } = await WebAssembly.instantiateStreaming(
  fetch(new URL("../target/wasm-gc/release/build/main/main.wasm", import.meta.url)),
  { js_string, spectest, js_io }
);

setMemory(instance.exports["moonbit.memory"]);
const exports = instance.exports as any;
exports._start();

function wrapString(remoteFn: (id: number) => void) {
  const id = js_io.create()
  return (input: string) => {
    js_io.writeInputString(id, input);
    remoteFn(id);
    const result = js_io.readOutputString(id);
    js_io.dispose(id)
    return result;
  }
}

function wrapBytes(remoteFn: (id: number) => void) {
  const id = js_io.create()
  return (input: Uint8Array) => {
    js_io.writeInputBytes(id, input);
    remoteFn(id);
    const result = js_io.readOutputBytes(id);
    js_io.dispose(id)
    return result;
  }
}

// remote write
Deno.test("remote write", () => {
  const echo = wrapString(exports.echo);
  const result = echo("Hello");
  console.log(result);
  assert(result === "echo Hello")
  flush()
});

// remote write
Deno.test("remote writeBytes", () => {
  const echoBytes = wrapBytes(exports.echoBytes);
  const bytes = new TextEncoder().encode("Hello");
  const result = echoBytes(bytes);
  assert(new TextDecoder().decode(result) === "Hello")
  flush()
});
