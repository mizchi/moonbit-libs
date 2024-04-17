# mizchi/js_regexp

JS RegExp Binding on moonbit

```bash
$ moon add mizchi/js_regexp
```

moon.pkg.json

```json
{
  "import": [
    "mizchi/js_regexp"
  ]
}
```

## Examples

include [js_regexp.js](./js_regexp.js) and [js_string.js](./js_string.js) to importObject

```js
// See https://github.com/moonbitlang/moonbit-docs/blob/main/examples/wasm-gc/index.html
import { js_string, spectest, flush, setMemory } from "./js_string.js";
import { js_regexp } from "./js_regexp.js";
const importObject = {
  js_regexp,
  js_string,
  spectest,
};
WebAssembly.instantiateStreaming(fetch("/target/wasm-gc/release/build/main/main.wasm"), importObject).then(
  (obj) => {
    const memory = obj.instance.exports["moonbit.memory"];
    setMemory(memory);
    obj.instance.exports._start();
    flush();
  }
)
```

Use it with `$ moon build --target wasm-gc`

```rust
// main/main.mbt
fn main {
  let re = @js_regexp.new("(\\w)(\\d+)", flags="im")
  let result1 = re.exec("H111")
  println("exec1: \(result1)") // Some([H111, H, 111])
  let result2 = re.exec("nop")
  println("exec2: \(result2)") // None
}
```

## with deno

Put `js_string.js` and `js_regexp.js`

```js
import { js_regexp } from "./js_regexp.js";
import { js_string, spectest, flush, setMemory } from "./js_string.js";

const { instance } = await WebAssembly.instantiateStreaming(
  fetch(new URL("./target/wasm-gc/release/build/main/main.wasm", import.meta.url)),
  { js_regexp, js_string, spectest }
);
const exports = instance.exports as any;
setMemory(instance.exports["moonbit.memory"]);
exports._start();
flush();
```

## LICENSE

MIT