pub fn stringify(
  self : JSONValue,
  ~depth : Int = 0,
  ~spaces : Int = 0,
  ~newline : Bool = false
) -> String {
  // println("depth \(depth)")
  match self {
    JSONValue::Boolean(b) => return if b { "true" } else { "false" }
    JSONValue::String(s) => return "\"\(s)\""
    JSONValue::IntNumber(n) => return n.to_string()
    JSONValue::DoubleNumber(n) => return n.to_string()
    JSONValue::Array(a) => {
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
              ~depth=depth + 1,
              ~spaces,
              ~newline,
            ) + suffix
        },
      )
      s += String::make(depth * spaces, ' ') + "]"
      return s
    }
    JSONValue::Object(o) => {
      let mut s = "{" + if newline { "\n" } else { "" }
      let pad = if spaces > 0 { " " } else { "" }
      for i = 0; i < o.length(); i = i + 1 {
        let (k, v) = o[i]
        let is_last = i == o.length() - 1
        let last = if is_last { "" } else { "," } + if newline {
            "\n"
          } else {
            ""
          }
        let vr = v.stringify(~depth=depth + 1, ~spaces, ~newline)
        s += String::make((depth + 1) * spaces, ' ') + "\(k):\(pad)\(vr)\(last)"
      }
      s += String::make(depth * spaces, ' ') + "}"
      return s
    }
    JSONValue::Null => return "null"
  }
}
