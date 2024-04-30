# mizchi/json

Note(2024/05/01): `moonbitlang/core` supports `@json5.parse`. Currently only `stringify` is left.

---

simple json parser with simple data structure


```bash
$ moon add mizchi/json
```

moon.pkg.json

```json
{
  "import": [
    "mizchi/json"
  ]
}
```

## Usage

```rust
fn main {
  let j = @json5.parse(
    #|{
    #|  "a": 1.1,
    #|  "b": [1, 2, 3],
    #|  "c": {
    #|    "d": 4
    #|  },
    #|  "d": null,
    #|  "e": true,
    #|  "f": false
    #|}
    ,
  ).unwrap()
  // like JSON.stringify({}, null, 2)
  let s = stringify(j, spaces=2, newline=true)
}
```

## Related works

- https://mooncakes.io/docs/#/peter-jerry-ye/json/

## LICENSE

MIT