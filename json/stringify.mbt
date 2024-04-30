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
