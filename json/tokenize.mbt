pub fn tokenize(input: String) -> List[String] {
  let len = input.length()
  let mut in_string_literal = false
  let tokens: @vec.Vec[String] = @vec.Vec::[]
  let buf: @vec.Vec[Char] = @vec.Vec::[]
  // TODO: use bytes instead of chars for speed
  // let bytes = input.to_bytes()
  fn eat() {
    if buf.length() > 0 {
      let mut s = ""
      buf.iter(fn (c) {
        s += c.to_string()
      })
      tokens.push(s)
      buf.clear()
    }
  }
  for i = 0; i < len; i = i + 1 {
    let char = input.get(i)
    let is_syntax_token = syntax_tokens.contains(char)
    if in_string_literal {
      // end
      if char == '"' {
        buf.push(char)
        eat()
        // tokens.push("\"")
        in_string_literal = false
        // println("leave literal mode")
        continue
      } 
      buf.push(char)
      continue
    }
    if is_syntax_token {
      if buf.length() > 0 {
        eat()
      }
      if char == ' ' || char == '\n' {
        continue
      }
      if char == '"' {
        in_string_literal = true
        buf.push(char)
      } else {
        tokens.push(char.to_string())
        buf.clear()
      }
      continue
    }
    buf.push(char)
  }
  if buf.length() > 0 {
    eat()
  }
  // println("tokens \(tokens)");
  return tokens.to_list()
}

test "tokenize null" {
  @assertion.assert_eq(
    tokenize("null"),
    List::["null"]
  )?
}

test "tokenize int" {
  @assertion.assert_eq(
    tokenize("1"),
    List::["1"]
  )?
}

test "tokenize double" {
  @assertion.assert_eq(
    tokenize("1.1"),
    List::["1.1"]
  )?
}

test "tokenize string" {
  @assertion.assert_eq(
    tokenize("\"a\""),
    List::["\"a\""]
  )?
}

test "tokenize array #1" {
  @assertion.assert_eq(
    tokenize("[]"),
    List::["[", "]"]
  )?
}

test "tokenize array #2" {
  @assertion.assert_eq(
    tokenize("[1]"),
    List::["[", "1", "]"]
  )?
}

test "tokenize object #1" {
  @assertion.assert_eq(
    tokenize("{}"),
    List::["{", "}"]
  )?
}

test "tokenize object #2" {
  @assertion.assert_eq(
    tokenize("{ \"a\": 1 }"),
    List::["{", "\"a\"", ":", "1", "}"]
  )?
}
