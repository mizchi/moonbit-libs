# mizchi/json

json utils

```bash
$ moon add mizchi/json
```

moon.pkg.json

Avoid `json` to use builtin `@json`

```json
{
  "import": [
    {
      "path": "mizchi/json",
      "alias": "jsonutil"
    }
  ]
}
```

## Usage

```rust
fn main {
  // use moonbitlang/core/json
  let j = @json.parse(
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
  let s = @jsonutil.stringify(j, spaces=2, newline=true)
}
```

Implment `ToJson` for struct

```rust
priv struct TestTree {
  val : Int
  child : Option[TestTree]
}

impl @jsonutil.ToJson for TestTree with to_json(self) {
  // list ToJson values with keys
  @jsonutil.from_entries([("val", self.val), ("child", self.child)])
}

test {
  let v : TestTree = { val: 1, child: Some({ val: 2, child: None }) }
  let j = @jsonutil.to_json(v)
  inspect(
    j,
    content="Object(Map::[(\"val\", Number(1.0)), (\"child\", Object(Map::[(\"val\", Number(2.0)), (\"child\", Null)]))])",
  )?
  inspect(@jsonutil.stringify(j), content="{val:1,child:{val:2,child:null}}")?
}
```

(I'm researching derive trait)

## Related works

- https://mooncakes.io/docs/#/peter-jerry-ye/json/

## LICENSE

MIT