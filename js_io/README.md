# mizchi/js_io

Create simple shared buffer io both js and moonbit.

```bash
$ moon add mizchi/js_io
```

(I will provide high level ffi on this later)

## Why

I need structured data api but not ready https://github.com/moonbitlang/moonbit-RFCs/pull/5

## API

Moonbit API

```rust
@js_io.read_buffer()
@js_io.write_buffer(bytes)
@js_io.read_string()
@js_io.write_string(string)
// Optional
@js_io.set_buffer_offset(0xFF)
```

JS API

```js
import { js_string, spectest, flush, setMemory, readBuffer, writeBuffer } from "./.mooncakes/mizchi/js_io/dist/mod.js"

// write
writeBuffer(new Uint8Array([1, 2, 3, 4, 5]));
// read
const buffer = readBuffer();
```

## Usage

```rust
// Usage
pub fn write_bytes_test() -> Unit {
  let bytes = @js_io.read_buffer()
  for i = 0; i < bytes.length(); i = i + 1 {
    bytes[i] = bytes[i] + 1
  }
  @js_io.write_buffer(bytes)
  ()
}

// Optional
pub fn set_buffer_offset(offset : Int) -> Unit {
  @js_io.set_buffer_offset(offset)
  ()
}
```

from js

```js
import { js_string, spectest, flush, setMemory, readBuffer, writeBuffer, setBufferOffset } from "./.mooncakes/mizchi/js_io/dist/mod.js"

const { instance } = await WebAssembly.instantiateStreaming(
  fetch(new URL("./target/wasm-gc/release/build/echo.wasm", import.meta.url)),
  { js_string, spectest }
);
setMemory(instance.exports["moonbit.memory"]);
const exports = instance.exports as any;
exports._start();

// Optional
// default js_string uses first page 0~ in memory
// and js_io uses 32768~ in memory
// use twice
{
  memory.grow(1); // to 128kb
  exports.set_buffer_offset(0xFF)
  set_buffer_offset(0xFF)
}

// echo
writeBuffer(new Uint8Array([1, 2, 3, 4, 5]));
exports.write_bytes_test();
const result = readBuffer();
console.log(result) // Uint8Array([2, 3, 4, 5, 6])
flush();
```

## How to develop

```bash
$ deno run -A script/build.ts
$ deno run -A script/test.ts
```

## TODO

- structured data protocol like json

## LICENSE

MIT