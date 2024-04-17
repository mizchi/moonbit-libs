# mizchi/js_io

Glue library to read/write string on JS WebAssembly

```bash
$ moon add mizchi/js_io
```

(I will provide high level ffi on this later)

## Why

I need structured data api but not ready https://github.com/moonbitlang/moonbit-RFCs/pull/5

## API

Moonbit API

```rust
let io = @js_io.new() // Create IO Context
let io = @js_io.from(id: Int) // Create IO Context from existed id

io.read_input() -> String // Read input
io.write_output(text: String) -> Unit
```

JS API

```js
import { js_io } from "./.mooncakes/mizchi/js_io/mod.js";
// moonbit js_string and spectest impl
import { js_string, spectest } from "./.mooncakes/mizchi/js_io/mod.js";

// add this to importObject
await WebAssembly.instantiateStreaming(fetch("..."), { js_string, spectest, js_io });

// read and write
const id = js_io.create();
js_io.writeInput(id, "Hello"); // write input
const buf = js_io.readOutput(id); // read as Uint8Array
const text = js_io.readOutputText(id); // read as text
```

## Echo example

```rust
// Usage
pub fn echo(id : Int) -> Unit {
  let io = @js_io.from(id)
  let input = io.read_input()
  io.write_output("echo " + input)
}
```

from js

```js
import { js_io } from "./.mooncakes/mizchi/js_io/mod.js";
import { js_string, spectest, flush, setMemory } from "./.mooncakes/mizchi/js_io/js_io.js"

const { instance } = await WebAssembly.instantiateStreaming(
  // your wasm path
  fetch(new URL("./target/wasm-gc/release/build/echo.wasm", import.meta.url)),
  { js_string, spectest, js_io }
);
setMemory(instance.exports["moonbit.memory"]);
const exports = instance.exports as any;
exports._start();

// echo
const id = js_io.create();
js_io.writeInput(id, "Hello");
exports.echo(id)
console.log(js_io.readOutputText(id2)); // echo Hello
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