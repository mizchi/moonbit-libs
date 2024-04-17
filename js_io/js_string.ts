// implement js_string spec
// See https://github.com/moonbitlang/moonbit-docs/blob/main/examples/wasm-gc/index.html
let memory: WebAssembly.Memory;
export function setMemory(newMemory: WebAssembly.Memory) {
  memory = newMemory;
}
const results: string[] = [];
export const [log, flush] = (() => {
  let buffer: number[] = [];
  function flush() {
    if (buffer.length > 0) {
      const text = new TextDecoder("utf-16").decode(new Uint16Array(buffer).valueOf());
      console.log(text);
      results.push(text);
      buffer = [];
    }
  }
  function log(ch: number) {
    if (ch == '\n'.charCodeAt(0)) { flush(); }
    else if (ch == '\r'.charCodeAt(0)) { /* noop */ }
    else { buffer.push(ch); }
  }
  return [log, flush]
})();

export const spectest = {
  print_char: log
}

export const js_string = {
  new: (offset: number, length: number) => {
    const bytes = new Uint16Array(memory.buffer, offset, length);
    const string = new TextDecoder("utf-16").decode(bytes);
    return string
  },
  empty: () => { return "" },
  log: (string: string) => { console.log(string) },
  append: (s1: string, s2: string) => { return (s1 + s2) },
};
