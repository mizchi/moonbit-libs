let syntax_tokens : Array[Char] = ['{', '}', '[', ']', '"', ':', ',', ' ', '\n']

pub enum JSONValue {
  String(String)
  Boolean(Bool)
  IntNumber(Int)
  DoubleNumber(Double)
  Object(Array[(String, JSONValue)])
  Array(Array[JSONValue])
  Null
} derive(Debug, Eq)

pub enum ParseError {
  OutOfRange(Int)
  ExpectEOF(Int)
  ExpectToken(Int, Array[String])
  NonStringKey(Int)
  UnknownExpr(Int, String)
  Unreachable(Int)
} derive(Debug, Eq)

pub fn parse(input : String) -> Result[JSONValue, ParseError] {
  let tokens = tokenize(input)
  match parse_literal(tokens, 0) {
    Ok((v, idx)) => {
      if idx != tokens.length() - 1 {
        return Err(ParseError::ExpectEOF(idx + 1))
      }
      Ok(v)
    }
    Err(reason) => Err(reason)
  }
}

fn parse_literal(
  tokens : List[String],
  idx : Int
) -> Result[(JSONValue, Int), ParseError] {
  // println("parse_literal \(idx)")
  match tokens.nth(idx) {
    None => Err(ParseError::OutOfRange(idx))
    Some(expr) =>
      match expr {
        "{" =>
          match parse_object(tokens, idx) {
            Ok((members, end)) => return Ok((JSONValue::Object(members), end))
            Err(reason) => return Err(reason)
          }
        "[" =>
          match parse_array(tokens, idx) {
            Ok((items, end)) => return Ok((JSONValue::Array(items), end))
            Err(error) => return Err(error)
          }
        "true" => return Ok((JSONValue::Boolean(true), idx))
        "false" => return Ok((JSONValue::Boolean(false), idx))
        "null" => return Ok((JSONValue::Null, idx))
        _ => {
          // string
          if expr.get(0) == '"' {
            let mut key = ""
            for i = 1; i < expr.length() - 1; i = i + 1 {
              key += expr.get(i).to_string()
            }
            return Ok((JSONValue::String(key), idx))
          }
          // int or double
          match @strconv.parse_int(expr) {
            Ok(v) => return Ok((JSONValue::IntNumber(v), idx))
            _ => {
              // or double
              let double = @strconv.parse_double(expr)
              if double.is_ok() {
                return Ok((JSONValue::DoubleNumber(double.unwrap()), idx))
              }
            }
          }
          Err(ParseError::UnknownExpr(idx, expr))
        }
      }
  }
}

fn parse_object(
  tokens : List[String],
  start : Int
) -> Result[(Array[(String, JSONValue)], Int), ParseError] {
  // println("parse_object \(start)")
  match tokens.nth(start) {
    None => return Err(ParseError::OutOfRange(start))
    Some(first) => {
      // parse_object_body(tokens, start)
      let items : @vec.Vec[(String, JSONValue)] = @vec.Vec::[]
      if first != "{" {
        return Err(ExpectToken(start, Array::["{"]))
      }
      let mut cur = start + 1 // sheck "{" <key>
      // always expect <key> : <value>
      while cur < tokens.length() {
        match tokens.nth(cur) {
          None => return Err(ExpectToken(cur, Array::["}", ",", "\"<key>\""]))
          // maybe blank object
          Some("}") => return Ok((items.to_list().to_array(), cur))
          // expect string key
          Some(key) => {
            // println("key \(key) \(cur)")
            match tokens.nth(cur + 1) {
              Some(":") => () // ok
              _ => return Err(ExpectToken(cur + 1, Array::[":"]))
            }
            // consume key : val
            match parse_literal(tokens, cur + 2) {
              Ok((v, end)) => {
                if key.get(0) != '"' {
                  return Err(ParseError::NonStringKey(cur))
                }
                let mut k = ""
                for i = 1; i < key.length() - 1; i = i + 1 {
                  k += key.get(i).to_string()
                }
                items.push((k, v))
                // peak next token
                match tokens.nth(end + 1) {
                  Some("}") => return Ok((items.to_list().to_array(), end + 1))
                  None => return Err(ExpectToken(end + 1, Array::["}", ","]))
                  Some(",") => {
                    cur = end + 2 // { "x": 1 , <here>
                    continue
                  }
                  Some(_) => return Err(ExpectToken(end, Array::["}", ","]))
                }
              }
              Err(reason) => return Err(reason)
            }
          }
        }
      }
      Err(ParseError::Unreachable(cur))
    }
  }
}

fn parse_array(
  tokens : List[String],
  start : Int
) -> Result[(Array[JSONValue], Int), ParseError] {
  if tokens.nth(start) != Some("[") {
    return Err(ExpectToken(start, Array::["["]))
  }
  let items : @vec.Vec[JSONValue] = @vec.Vec::[]
  let mut cur = start + 1 // "[" <here>
  while cur < tokens.length() {
    match tokens.nth(cur) {
      None => return Err(ParseError::OutOfRange(cur))
      Some("]") => return Ok((items.to_list().to_array(), cur))
      Some(_) =>
        match parse_literal(tokens, cur) {
          Err(reason) => return Err(reason)
          Ok((v, end)) => {
            items.push(v)
            match tokens.nth(end + 1) {
              Some("]") => return Ok((items.to_list().to_array(), end + 1))
              Some(",") => {
                cur = end + 2
                continue
              }
              _ => return Err(ExpectToken(end + 1, Array::["]", ","]))
            }
          }
        }
    }
  }
  Err(ParseError::Unreachable(cur))
}
