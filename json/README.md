# mizchi/json

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
  let input =
    #| {
    #|  "items": [1],
    #|  "nested": {
    #|    "items": [1, 2, 3, 4.5]
    #|  },
    #|  "items2": [{"a": 1}, {"b": 2}],
    #|  "next": null
    #| }

  let parsed = @json.parse(input).unwrap()
  debug(parsed) // debuggable
  println(parsed.stringify())
  //=> {items:[1],nested:{items:[1,2,3,4.5]},items2:[{a:1},{b:2}],next:null}

  // readable json like JSON.stringify(obj, null, 2)
  println(parsed.stringify(~spaces=2, ~newline=true))

  // build json tree
  let data = @json.JSONValue::Object(
    [
      ("key", @json.JSONValue::String("val")),
      ("items", @json.JSONValue::Array([@json.JSONValue::IntNumber(1)])),
    ],
  )
  // you can stringify
  println(data.stringify())

  // handle parse error
  match @json.parse("{}}") {
    Err(err) => debug(err)
    _ => println("unreachable")
  }
}
```

## Related works

- https://mooncakes.io/docs/#/peter-jerry-ye/json/

## TODO

- parser generator
- typescript codegen
- wit codegen

## LICENSE

MIT