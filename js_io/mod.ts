// See https://github.com/moonbitlang/moonbit-docs/blob/main/examples/wasm-gc/index.html
let _memory: WebAssembly.Memory;
let _offset = 32768;

export function setMemory(newMemory: WebAssembly.Memory) {
  _memory = newMemory;
}

export function setBufferOffset(newOffset: number) {
  _offset = newOffset;
}

export const [log, flush] = (() => {
  let buffer: number[] = [];
  function flush() {
    if (buffer.length > 0) {
      const text = new TextDecoder("utf-16").decode(new Uint16Array(buffer).valueOf());
      console.log(text);
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
    const bytes = new Uint16Array(_memory.buffer, offset, length);
    return new TextDecoder("utf-16").decode(bytes);
  },
  empty: () => { return "" },
  log: (string: string) => { console.log(string) },
  append: (s1: string, s2: string) => { return (s1 + s2) },
};

export function writeBuffer(bytes: Uint8Array) {
  const buf = new Uint8Array(_memory.buffer);
  const intBytes = intToBytes(bytes.byteLength);
  buf.set(intBytes, _offset);
  // auto grow
  if (buf.byteLength < bytes.byteLength + _offset + intBytes.byteLength) {
    const newPageSize = Math.ceil((bytes.byteLength + _offset) / 65536);
    const delta = newPageSize - Math.ceil(_memory.buffer.byteLength / 65536);
    _memory.grow(delta);
  }
  buf.set(bytes, intBytes.byteLength + _offset);
}

export function readBuffer(): Uint8Array {
  const buf = new Uint8Array(_memory.buffer);
  const len = getLength(buf, _offset);
  return buf.slice(_offset + 4, _offset + 4 + len);
}

export function writeString(str: string) {
  const buf = new TextEncoder().encode(str);
  writeBuffer(buf);
}

export function readString(): string {
  const buf = readBuffer();
  return new TextDecoder().decode(buf);
}

function getLength(buffer: Uint8Array, offset: number): number {
  return new DataView(buffer.buffer, offset, 4).getInt32(0, true);
}

function intToBytes(value: number): Uint8Array {
  const buffer = new ArrayBuffer(4);
  const dataView = new DataView(buffer);
  dataView.setInt32(0, value | 0, true);
  return new Uint8Array(buffer);
}

