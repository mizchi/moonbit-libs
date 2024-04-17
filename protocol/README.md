# mizchi/protocol

Experimental encoder/decoder protocol to send structured data on moonbit

```bash
$ moon add mizchi/js_io
$ moon add mizchi/protocol
```

## API

See [working example](./main)

```rust
pub fn write_struct(id : Int) -> Unit {
  let io = @js_io.from(id)
  // get buffer from js
  let input = io.read_input_bytes()
  // TODO: moonbit protocol decoder

  // ["hello", 42]
  let v = @protocol.encode(
    @protocol.Item::Array(
      [@protocol.Item::String("hello"), @protocol.Item::Int(42)],
    ),
  )
  io.write_output_bytes(v)
}
```

Js runner (deno)

```js
import { js_string, spectest, flush, setMemory } from "./.mooncakes/mizchi/js_io/dist/js_string.js"
import { js_io, stringToString, bytesToBytes } from "./.mooncakes/mizchi/js_io/dist/mod.js";
import { decode } from "../mod.ts";

// Initialize moonbit
const { instance } = await WebAssembly.instantiateStreaming(
  fetch(new URL("../target/wasm-gc/release/build/main/main.wasm", import.meta.url)),
  { js_string, spectest, js_io }
);
setMemory(instance.exports["moonbit.memory"]);
const exports = instance.exports as any;
exports._start();

// Wrap remote function
const write_struct = bytesToBytes(exports.write_struct);
const buf = write_struct(new Uint8Array([
  1, 2, 3
]));
const decoded = decode(buf);
consolel.log("decoded", decoded);
flush()
```

## How to develop

```bash
$ deno run -A script/build.ts
$ deno run -A script/test.ts
```

## TODO

- [x] Moonbit Protocol Encoder
- [ ] Moonbit Protocol Decoder
- [x] JS Protocol Encoder
- [x] JS Protocol Decoder
- [ ] Schema generator (zod, wit, or something?)
- [ ] Validator

## LICENSE

MIT