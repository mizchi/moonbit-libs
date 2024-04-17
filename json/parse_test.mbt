test "parse null" {
  @assertion.assert_eq(parse("null"), Ok(JSONValue::Null))?
}

test "parse true" {
  @assertion.assert_eq(parse("true"), Ok(JSONValue::Boolean(true)))?
}

test "parse false" {
  @assertion.assert_eq(parse("false"), Ok(JSONValue::Boolean(false)))?
}

test "parse string" {
  @assertion.assert_eq(parse("\"hi\""), Ok(JSONValue::String("hi")))?
}

test "parse int" {
  @assertion.assert_eq(parse("1"), Ok(JSONValue::IntNumber(1)))?
}

test "parse double" {
  @assertion.assert_eq(parse("1.1"), Ok(JSONValue::DoubleNumber(1.1)))?
}

test "parse blank object" {
  @assertion.assert_eq(parse("{}"), Ok(JSONValue::Object([])))?
}

test "parse 1 item object" {
  @assertion.assert_eq(
    parse("{ \"key\": \"val\" }"),
    Ok(JSONValue::Object([("key", JSONValue::String("val"))])),
  )?
}

test "parse multi items object" {
  @assertion.assert_eq(
    parse("{ \"key\": \"val\", \"x\": \"y\" }"),
    Ok(
      JSONValue::Object(
        [("key", JSONValue::String("val")), ("x", JSONValue::String("y"))],
      ),
    ),
  )?
}

test "parse nested object" {
  @assertion.assert_eq(
    parse("{ \"key\": { \"v\": 1 } }"),
    Ok(
      JSONValue::Object(
        [("key", JSONValue::Object([("v", JSONValue::IntNumber(1))]))],
      ),
    ),
  )?
}

test "parse blank array" {
  @assertion.assert_eq(
    parse(

      #| []
      ,
    ),
    Ok(JSONValue::Array([])),
  )?
}

test "parse 1 item array" {
  @assertion.assert_eq(
    parse(

      #| [1]
      ,
    ),
    Ok(JSONValue::Array([JSONValue::IntNumber(1)])),
  )?
}

test "parse 2 items array" {
  @assertion.assert_eq(
    parse(

      #| [1, 2]
      ,
    ).unwrap(),
    JSONValue::Array([JSONValue::IntNumber(1), JSONValue::IntNumber(2)]),
  )?
}

test "parse error : expect eof" {
  @assertion.assert_eq(
    parse(

      #| {}}
      ,
    ),
    Err(ParseError::ExpectEOF(2)),
  )?
}

test "parse error : expect eof" {
  @assertion.assert_eq(
    parse(

      #| 1,
      ,
    ),
    Err(ParseError::ExpectEOF(1)),
  )?
}

test "parse error : invalid object" {
  @assertion.assert_eq(
    parse(

      #| {
      ,
    ),
    Err(ParseError::Unreachable(1)),
  )?
}

test "parse error : expect object end" {
  @assertion.assert_eq(
    parse(

      #| { "v": 1
      ,
    ),
    Err(ParseError::ExpectToken(4, Array::["}", ","])),
  )?
}

test "parse error : out of range" {
  @assertion.assert_eq(
    parse(

      #| { "x"
      ,
    ),
    Err(ParseError::ExpectToken(2, Array::[":"])),
  )?
}

test "invalid json #2" {
  @assertion.assert_eq(
    parse(

      #| { "x" "y"
      ,
    ),
    Err(ParseError::ExpectToken(2, Array::[":"])),
  )?
}

test "invalid json #3" {
  @assertion.assert_eq(
    parse(

      #| []]
      ,
    ),
    Err(ParseError::ExpectEOF(2)),
  )?
}

test "invalid json #4" {
  @assertion.assert_eq(
    parse(

      #| [1
      ,
    ),
    Err(ParseError::ExpectToken(2, Array::["]", ","])),
  )?
}

test "invalid json #5" {
  @assertion.assert_eq(
    parse(

      #| [1,2}
      ,
    ),
    Err(ParseError::ExpectToken(4, Array::["]", ","])),
  )?
}

test "invalid json #6" {
  @assertion.assert_eq(
    parse(

      #| { null : 1 }
      ,
    ),
    Err(ParseError::NonStringKey(1)),
  )?
}
