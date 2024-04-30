pub trait ToJson {
  to_json(Self) -> @json.JsonValue
}

pub impl ToJson for Int with to_json(self) {
  @json.JsonValue::Number(self.to_double())
}

pub impl ToJson for String with to_json(self) { @json.JsonValue::String(self) }

pub impl ToJson for Bool with to_json(self) { @json.JsonValue::Boolean(self) }

pub impl ToJson for Double with to_json(self) { @json.JsonValue::Number(self) }

pub impl ToJson for Unit with to_json(_self) { @json.JsonValue::Null }

pub impl[T : ToJson] ToJson for Option[T] with to_json(self) {
  match self {
    Some(x) => x.to_json()
    None => @json.JsonValue::Null
  }
}

pub fn stringify(
  json : @json.JsonValue,
  ~depth : Int = 0,
  ~spaces : Int = 0,
  ~newline : Bool = false
) -> String {
  match json {
    @json.JsonValue::Boolean(b) => if b { "true" } else { "false" }
    @json.JsonValue::String(s) => "\"\(s)\""
    @json.JsonValue::Number(n) => {
      let i = n.to_int()
      if i.to_double() == n {
        i.to_string()
      } else {
        n.to_string()
      }
    }
    @json.JsonValue::Array(a) => {
      let mut s = "[" + if newline { "\n" } else { "" }
      a.iteri(
        fn(i, v) {
          let suffix = if i == a.length() - 1 { "" } else { "," } + if newline {
              "\n"
            } else {
              ""
            }
          s += String::make((depth + 1) * spaces, ' ') + stringify(
              v,
              depth=depth + 1,
              ~spaces,
              ~newline,
            ) + suffix
        },
      )
      s += String::make(depth * spaces, ' ') + "]"
      return s
    }
    @json.JsonValue::Object(members) => {
      let mut s = "{" + if newline { "\n" } else { "" }
      let pad = if spaces > 0 { " " } else { "" }
      members.iteri(
        fn(i, k, v) {
          // members.size()
          let is_last = i == members.size() - 1
          let last = if is_last { "" } else { "," } + if newline {
              "\n"
            } else {
              ""
            }
          let vr = stringify(v, depth=depth + 1, ~spaces, ~newline)
          s += String::make((depth + 1) * spaces, ' ') + "\(k):\(pad)\(vr)\(last)"
        },
      )
      s += String::make(depth * spaces, ' ') + "}"
      return s
    }
    @json.JsonValue::Null => return "null"
  }
}

impl ToJson for Array[ToJson] with to_json(self) {
  @json.JsonValue::Array(@vec.Vec::from_array(self.map(fn(x) { x.to_json() })))
}

impl ToJson for @vec.Vec[ToJson] with to_json(self) {
  let new_values : @vec.Vec[@json.JsonValue] = @vec.Vec::new()
  self.iter(fn(x) { new_values.push(x.to_json()) })
  @json.JsonValue::Array(new_values)
}

impl ToJson for @map.Map[String, ToJson] with to_json(self) {
  @json.JsonValue::Object(self.map(fn(v) { v.to_json() }))
}

pub fn from_entries(members : Array[(String, ToJson)]) -> @json.JsonValue {
  @json.JsonValue::Object(
    @map.Map::from_array(members.map(fn(k) { (k.0, k.1.to_json()) })),
  )
}

pub fn to_json[T : ToJson](x : T) -> @json.JsonValue {
  x.to_json()
}

test {
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
  let s = stringify(j, spaces=2, newline=true)
  inspect(
    s,
    content=#|{
    #|  a: 1.1,
    #|  b: [
    #|    1,
    #|    2,
    #|    3
    #|  ],
    #|  c: {
    #|    d: 4
    #|  },
    #|  d: null,
    #|  e: true,
    #|  f: false
    #|}
    ,
  )?
}

test {
  let j = @json5.parse(
    #|{
    #|  "a": 1
    #|}
    ,
  ).unwrap()
  let s = stringify(j)
  inspect(s, content="{a:1}")?
}

fn is_int(x : Double) -> Bool {
  x == x.to_int().to_double()
}

test {
  inspect(is_int(1.0), content="true")?
  inspect(is_int(1.1), content="false")?
}

// -----------
priv struct TestTree {
  val : Int
  child : Option[TestTree]
}

impl ToJson for TestTree with to_json(self) {
  from_entries([("val", self.val), ("child", self.child)])
}

test {
  let v : TestTree = { val: 1, child: Some({ val: 2, child: None }) }
  let j = to_json(v)
  inspect(
    j,
    content="Object(Map::[(\"val\", Number(1.0)), (\"child\", Object(Map::[(\"val\", Number(2.0)), (\"child\", Null)]))])",
  )?
  inspect(stringify(j), content="{val:1,child:{val:2,child:null}}")?
}
