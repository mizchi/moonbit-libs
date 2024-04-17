// implement js_string spec
// See https://github.com/moonbitlang/moonbit-docs/blob/main/examples/wasm-gc/index.html
let memory;
export function setMemory(newMemory) {
  memory = newMemory;
}
const results = [];
export const [log, flush] = (() => {
  let buffer = [];
  function flush() {
    if (buffer.length > 0) {
      const text = new TextDecoder("utf-16").decode(new Uint16Array(buffer).valueOf());
      console.log(text);
      results.push(text);
      buffer = [];
    }
  }
  function log(ch) {
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
  new: (offset, length) => {
    const bytes = new Uint16Array(memory.buffer, offset, length);
    const string = new TextDecoder("utf-16").decode(bytes);
    return string
  },
  empty: () => { return "" },
  log: (string) => { console.log(string) },
  append: (s1, s2) => { return (s1 + s2) },
};
