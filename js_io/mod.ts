type IO = {
  input: number[],
  output: number[],
}

function initialize_js_io() {
  // internal unique id
  let id = 0;
  // singleton cache
  const cache = new Map<number, IO>();
  return {
    // shared
    dispose,
    // remote api
    create,
    read_input,
    write_output,
    clear_input,
    clear_output,
    // js only api (yet)
    writeInputString,
    writeInputBytes,
    readOutputBytes,
    readOutputString,
  }
  // create a new buffer in host from guest
  function create(): number {
    const newId = id++;
    const io = {
      input: [],
      output: [],
    } as IO;
    cache.set(newId, io);
    return newId;
  }

  // read a char from buffer in host
  function read_input(id: number): number {
    const buf = cache.get(id)!;
    if (!buf) throw new Error('buf not found');
    const char = buf.input.shift();
    if (char == null) return -1;
    return char;
    // return buf.in.push(char);
  }

  // reset buffer in host
  function clear_output(id: number) {
    const buf = cache.get(id)!;
    buf.output.length = 0;
  }
  // reset buffer in host
  function clear_input(id: number) {
    const buf = cache.get(id)!;
    buf.output.length = 0;
  }
  // write a char to buffer in host
  function write_output(id: number, char: number) {
    const buf = cache.get(id)!;
    return buf.output.push(char);
  }

  // js
  function writeInputString(id: number, text: string) {
    const buf = cache.get(id)!;
    buf.input.length = 0;
    const encoder = new TextEncoder().encode(text);
    for (const char of encoder) {
      buf.input.push(char);
    }
  }
  // js
  function writeInputBytes(id: number, bytes: Uint8Array) {
    const buf = cache.get(id)!;
    buf.input.length = 0;
    for (const char of bytes) {
      buf.input.push(char);
    }
  }

  // js
  function readOutputBytes(id: number): Uint8Array {
    const buf = cache.get(id)!;
    const b = new Uint8Array(buf.output.slice());
    buf.output.length = 0;
    return b;
  }
  // js
  function readOutputString(id: number): string {
    const buffer = readOutputBytes(id);
    return new TextDecoder().decode(buffer);
  }

  // js
  function dispose(id: number): void {
    cache.delete(id);
  }
}

export const js_io = initialize_js_io();
