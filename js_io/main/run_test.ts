import { js_string, spectest, flush, setMemory, readBuffer, writeBuffer, setBufferOffset, writeString, readString } from "../mod.ts";
import { expect } from "jsr:@std/expect@0.223.0";

const { instance } = await WebAssembly.instantiateStreaming(
  fetch(new URL("../target/wasm-gc/release/build/main/main.wasm", import.meta.url)),
  { js_string, spectest }
);

const memory = instance.exports['moonbit.memory'] as WebAssembly.Memory;
memory.grow(3);
setMemory(memory);

const exports = instance.exports as any;
exports._start();

const offset = memory.buffer.byteLength / 4;
exports.set_buffer_offset(offset);
setBufferOffset(offset);

// remote write
Deno.test("write_bytes", () => {
  writeBuffer(new Uint8Array([1, 2, 3, 4, 5]));
  exports.write_bytes_test();
  const result = readBuffer();
  expect(result).toEqual(new Uint8Array([2, 3, 4, 5, 6]));
  flush();
});

// remote write
Deno.test("string", () => {
  writeString("hello");
  exports.write_string_test();
  const loaded = readString();
  expect(loaded).toEqual("hello!");
});
