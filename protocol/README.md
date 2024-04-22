# mizchi/protocol

Experimental encoder/decoder protocol to send/receive structured data on moonbit and js

```bash
$ moon add mizchi/protocol
$ moon add mizchi/js_io
```

## API

See [working example](./main)

```rust
pub fn write_struct() -> Unit {
  let input = @js_io.read_buffer()
  let _decoded = @protocol.decode(input)
  // ["hello", 42]
  let v = @protocol.encode(
    @protocol.Item::Array(
      [@protocol.Item::String("hello"), @protocol.Item::Int(42)],
    ),
  )
  @js_io.write_buffer(v)
}
```

Js runner (deno)

```js
import { js_string, spectest, flush, setMemory, writeBuffer, readBuffer } from "./.mooncakes/mizchi/js_io/dist/js_string.js"
import { decode } from "../mod.ts";

// wrap input/output
function protocol<F extends (...args: Element[]) => Element = (...args: any[]) => any>(fun: () => void) {
  const f = (...args: Element[]) => {
    const encoded_input = encode(args);
    writeBuffer(encoded_input);
    fun();
    const buf = readBuffer();
    const decoded = decode(buf);
    return decoded;
  }
  return f as F;
}

// Initialize moonbit
const { instance } = await WebAssembly.instantiateStreaming(
  fetch(new URL("../target/wasm-gc/release/build/main/main.wasm", import.meta.url)),
  { js_string, spectest }
);
setMemory(instance.exports["moonbit.memory"]);
const exports = instance.exports as any;
exports._start();

// Wrap remote function
const write_struct = protocol(exports.write_struct);

const buf = write_struct([
  1, 2, 3
]);
const decoded = decode(buf);
flush()
```

## How to develop

```bash
$ deno run -A script/build.ts
$ deno run -A script/test.ts
```

## TODO

- [x] Moonbit Protocol Encoder
- [x] Moonbit Protocol Decoder
- [x] JS Protocol Encoder
- [x] JS Protocol Decoder
- [ ] trait API
- [ ] Schema generator (wit or something?)
- [ ] Validator
- [ ] Benchmark

## LICENSE

MIT