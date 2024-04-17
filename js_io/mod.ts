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
    // remote api
    create,
    read_input,
    write_output,
    clear_input,
    clear_output,
    // js only api (yet)
    writeInput,
    readOutput,
    readOutputText,
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
  function read_input(id: number) {
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
  function writeInput(id: number, text: string) {
    const buf = cache.get(id)!;
    buf.input.length = 0;
    const encoder = new TextEncoder().encode(text);
    for (const char of encoder) {
      buf.input.push(char);
    }
  }
  // js
  function readOutput(id: number): Uint8Array {
    const buf = cache.get(id)!;
    const b = new Uint8Array(buf.output.slice());
    buf.output.length = 0;
    return b;
  }
  // js
  function readOutputText(id: number): string {
    const buffer = readOutput(id);
    return new TextDecoder().decode(buffer);
  }
}

export const js_io = initialize_js_io();
