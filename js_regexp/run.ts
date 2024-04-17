// deno run --allow-read run.ts
import { js_regexp } from "./js_regexp.js";
import { js_string, spectest, flush, setMemory } from "./js_string.js";

const { instance } = await WebAssembly.instantiateStreaming(
  fetch(new URL("./target/wasm-gc/release/build/main/main.wasm", import.meta.url)),
  { js_regexp, js_string, spectest }
);
const exports = instance.exports as any;
setMemory(instance.exports["moonbit.memory"]);
exports._start();
flush();
