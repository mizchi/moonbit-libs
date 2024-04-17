import { assert } from "https://deno.land/std@0.209.0/assert/assert.ts";
import { js_string, spectest, flush, setMemory } from "../dist/js_string.js"
import { js_io } from "../dist/mod.js";

const { instance } = await WebAssembly.instantiateStreaming(
  fetch(new URL("../target/wasm-gc/release/build/main/main.wasm", import.meta.url)),
  { js_string, spectest, js_io: js_io }
);

setMemory(instance.exports["moonbit.memory"]);
const exports = instance.exports as any;
exports._start();

// remote write
Deno.test("remote write", () => {
  const id = exports.write_hello();
  const result = js_io.readOutputString(id);
  // console.log(result);
  assert(result === "Hello, World!");
  // remote read
  const id2 = js_io.create()
  js_io.writeInputString(id2, "Hello");
  exports.echo(id2);
  const ret2 = js_io.readOutputString(id2);
  assert(ret2 === "echo Hello");
  flush()
});
