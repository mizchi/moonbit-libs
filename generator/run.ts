// let memory: WebAssembly.Memory;

// function buildString(buf: Array<number>) {
//   const text = new TextDecoder("utf-16").decode(new Uint16Array(buf).valueOf());
//   return text;
// }

// export const createBuf = () => {
//   const input = [] as number[];
//   const output = [] as number[];
//   return {
//     run() {
//       const text = buildString(input);
//     },
//     clear: () => input.length = 0,
//     write: (ch: number) => input.push(ch),
//     read: () => output.shift() ?? -1
//   }
// }

// const [log, flush] = (() => {
//   let buffer: number[] = [];
//   function flush() {
//     if (buffer.length > 0) {
//       console.log(new TextDecoder("utf-16").decode(new Uint16Array(buffer).valueOf()));
//       buffer = [];
//     }
//   }
//   function log(ch: number) {
//     if (ch == '\n'.charCodeAt(0)) { flush(); }
//     else if (ch == '\r'.charCodeAt(0)) { /* noop */ }
//     else { buffer.push(ch); }
//   }
//   return [log, flush]
// })();

// const importObject = {
//   spectest: {
//     print_char: log
//   },
//   js_string: {
//     new: (offset: number, length: number) => {
//       const bytes = new Uint16Array(memory.buffer, offset, length);
//       const string = new TextDecoder("utf-16").decode(bytes);
//       return string
//     },
//     empty: () => { return "" },
//     log: (string: string) => { console.log(string) },
//     append: (s1: string, s2: string) => { return (s1 + s2) },
//   }
// };
const { instance } = await WebAssembly.instantiateStreaming(
  fetch(new URL("./target/wasm-gc/release/build/generator.wasm", import.meta.url)),
  {}
);
// @ts-ignore
instance.exports._start();

// console.log(instance.exports)
// const { gen, gen_next } = instance.exports as any

import { run } from './gen.ts'
// @ts-ignore
for (const i of run(instance.exports.counter_init, instance.exports.counter_next)) {
  console.log(i)
}

// console.log(n1, n2)


// flush();
