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
const id = exports.write_hello();
const result = js_io.readOutputText(id);
console.log("remote:", result);

// remote read
const id2 = js_io.create()
js_io.writeInput(id2, "Hello from JS");
exports.echo(id2);
const ret2 = js_io.readOutputText(id2);
console.log("remote:", ret2);

flush()
