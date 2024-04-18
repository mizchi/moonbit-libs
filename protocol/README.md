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
  let input = io.read_input_bytes()

  // decode input as structured object : protocol.Item
  let _decoded = @protocol.decode(input)

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

## Strict Pattern

I'm still trying to figure out what would be best.

```rust
struct TypedInput {
  x : Int
  y : Int
}

struct TypedOutput {
  v : String
}

pub fn with_validate(id : Int) -> Unit {
  let io = @js_io.from(id)
  let input = io.read_input_bytes()
  let decoded = @protocol.decode(input)
  match TypedInput::from_input(decoded) {
    Some(input) => {
      let out = with_validate_strict(input)
      let item = out.to_output()
      let encoded = @protocol.encode(item)
      io.write_output_bytes(encoded)
    }
    None =>
      ()
  }
}

// inner logic
fn with_validate_strict(input : TypedInput) -> TypedOutput {
  let x = input.x
  let y = input.y
  println("x: \(x), y: \(y)")
  { v: "ok" }
}

// decoding to raw struct
fn TypedInput::from_input(item : @protocol.Item) -> Option[TypedInput] {
  let mut x = 0
  let mut y = 0
  let mut initialized = false
  match item {
    @protocol.Item::Array([ @protocol.Item::Object(members), .. ]) =>
      members.iter(
        fn(member) {
          match member {
            ("x", @protocol.Item::Int(value)) => x = value
            ("y", @protocol.Item::Int(value)) => y = value
            _ => ()
          }
          initialized = true
        },
      )
    _ => ()
  }
  if initialized {
    Some(TypedInput::{ x, y })
  } else {
    None
  }
}

// convert struct to serializable item
fn TypedOutput::to_output(self : TypedOutput) -> @protocol.Item {
  @protocol.Item::Object([("v", @protocol.Item::String(self.v))])
}
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