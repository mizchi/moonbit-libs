let data_type_string = 0x01

let data_type_int = 0x02

let data_type_float = 0x03

let data_type_boolean = 0x04

let data_type_null = 0x05

let data_type_array = 0x06

let data_type_object = 0x07

pub enum Item {
  Int(Int)
  Float(Double)
  String(String)
  Boolean(Bool)
  Null
  Array(Array[Item])
  Object(Array[(String, Item)])
} derive(Eq, Debug)

pub fn encode(item : Item) -> Bytes {
  encode_part(item)
}

fn encode_int(value : Int) -> Bytes {
  let bytes = Bytes::make(4, 0)
  bytes[0] = value.land(0xFF)
  bytes[1] = value.lsr(8).land(0xFF)
  bytes[2] = value.lsr(16).land(0xFF)
  bytes[3] = value.lsr(24).land(0xFF)
  // }
  bytes
}

// JavaScript's TextEncoder.encode
fn encode_string(s : String) -> Bytes {
  let result = @vec.Vec::[]
  for i = 0; i < s.length(); i = i + 1 {
    let char = s[i]
    let code = char.to_int()
    if code < 0x80 {
      result.push(code)
    } else if code < 0x800 {
      result.push((0xC0).lor(code.lsr(6)))
      result.push((0x80).lor(code.land(0x3F)))
    } else if code < 0x10000 {
      result.push((0xE0).lor(code.lsr(12)))
      result.push((0x80).lor(code.lsr(6).land(0x3F)))
      result.push((0x80).lor(code.land(0x3F)))
    } else {
      result.push((0xF0).lor(code.lsr(18)))
      result.push((0x80).lor(code.lsr(12).land(0x3F)))
      result.push((0x80).lor(code.lsr(6).land(0x3F)))
      result.push((0x80).lor(code.land(0x3F)))
    }
  }
  let bytes = Bytes::make(result.length(), 0)
  for i = 0; i < result.length(); i = i + 1 {
    bytes[i] = result[i]
  }
  bytes
}

fn encode_float(f : Double) -> Bytes {
  let bits = f.reinterpret_as_i64() // 浮動小数点数を64ビット整数として解釈
  let bytes = Bytes::make(8, 0) // 8バイトの配列を作成し、初期値は0
  bytes[7] = bits.lsr(56).land((0xFF).to_int64()).to_int()
  bytes[6] = bits.lsr(48).land((0xFF).to_int64()).to_int()
  bytes[5] = bits.lsr(40).land((0xFF).to_int64()).to_int()
  bytes[4] = bits.lsr(32).land((0xFF).to_int64()).to_int()
  bytes[3] = bits.lsr(24).land((0xFF).to_int64()).to_int()
  bytes[2] = bits.lsr(16).land((0xFF).to_int64()).to_int()
  bytes[1] = bits.lsr(8).land((0xFF).to_int64()).to_int()
  bytes[0] = bits.land((0xFF).to_int64()).to_int()
  return bytes
}

fn encode_length(length : Int) -> Bytes {
  let bytes = encode_int(length)
  let buf = Bytes::make(1 + bytes.length(), 0)
  buf[0] = bytes.length()
  buf.blit(1, bytes, 0, bytes.length())
  buf
}

// items
fn encode_int_part(value : Int) -> Bytes {
  let mut offset = 0
  let int_expr = encode_int(value)
  let len_expr = encode_int(int_expr.length())
  let buf = Bytes::make(1 + int_expr.length() + 1 + int_expr.length(), 0)
  buf[offset] = data_type_int
  offset = offset + 1
  buf[offset] = len_expr.length()
  offset = offset + 1
  buf.blit(offset, len_expr, 0, len_expr.length())
  offset = offset + len_expr.length()
  buf.blit(offset, int_expr, 0, int_expr.length())
  buf
}

fn encode_float_part(value : Double) -> Bytes {
  let float_expr = encode_float(value)
  let len_expr = encode_length(float_expr.length())
  let buf = Bytes::make(1 + len_expr.length() + float_expr.length(), 0)
  buf[0] = data_type_float
  buf.blit(1, len_expr, 0, len_expr.length())
  buf.blit(1 + len_expr.length(), float_expr, 0, float_expr.length())
  buf
}

fn encode_null_part() -> Bytes {
  Bytes::make(1, data_type_null)
}

fn encode_boolean_part(v : Bool) -> Bytes {
  let buf = Bytes::make(2, 0)
  buf[0] = data_type_boolean
  buf[1] = if v { 1 } else { 0 }
  buf
}

fn bytes_to_array(bytes : Bytes) -> Array[Int] {
  let array = Array::make(bytes.length(), 0)
  for i = 0; i < bytes.length(); i = i + 1 {
    array[i] = bytes[i]
  }
  return array
}

fn encode_string_item(s : String) -> Bytes {
  let text_bytes = encode_string(s)
  let len = encode_length(text_bytes.length())
  let bytes = Bytes::make(1 + len.length() + text_bytes.length(), 55)
  bytes[0] = data_type_string
  bytes.blit(1, len, 0, len.length())
  bytes.blit(1 + len.length(), text_bytes, 0, text_bytes.length())
  bytes
}

fn append_bytes_to_vec(buf : @vec.Vec[Int], bytes : Bytes) -> Unit {
  for i = 0; i < bytes.length(); i = i + 1 {
    buf.push(bytes[i])
    // buf[i] = bytes[i - offset]
  }
}

fn encode_part(item : Item) -> Bytes {
  match item {
    Item::Int(v) => encode_int_part(v)
    Item::Float(v) => encode_float_part(v)
    Item::String(v) => encode_string_item(v)
    Item::Boolean(v) => encode_boolean_part(v)
    Item::Null => encode_null_part()
    Item::Array(items) => {
      let buf = @vec.Vec::[]
      buf.push(data_type_array)
      append_bytes_to_vec(buf, encode_length(items.length()))
      for i = 0; i < items.length(); i = i + 1 {
        let item = items[i]
        let item_expr = encode_part(item)
        append_bytes_to_vec(buf, item_expr)
      }
      let bytes = Bytes::make(buf.length(), 0)
      for i = 0; i < buf.length(); i = i + 1 {
        bytes[i] = buf[i]
      }
      bytes
    }
    Item::Object(members) => {
      let buf = @vec.Vec::[]
      buf.push(data_type_object)
      append_bytes_to_vec(buf, encode_length(members.length()))
      for i = 0; i < members.length(); i = i + 1 {
        let (key, item) = members[i]
        let key_expr = encode_string_item(key)
        append_bytes_to_vec(buf, key_expr)
        let item_expr = encode_part(item)
        append_bytes_to_vec(buf, item_expr)
      }
      // to bytes
      let bytes = Bytes::make(buf.length(), 0)
      for i = 0; i < buf.length(); i = i + 1 {
        bytes[i] = buf[i]
      }
      bytes
    }
  }
}

test "encode_length" {
  @assertion.assert_eq(bytes_to_array(encode_length(1)), [4, 1, 0, 0, 0])?
  @assertion.assert_eq(bytes_to_array(encode_length(2)), [4, 2, 0, 0, 0])?
}

test "encode_length" {
  @assertion.assert_eq(bytes_to_array(encode_length(1)), [4, 1, 0, 0, 0])?
  @assertion.assert_eq(bytes_to_array(encode_length(2)), [4, 2, 0, 0, 0])?
}

test "int_to_bytes" {
  @assertion.assert_eq(bytes_to_array(encode_int(1)), [1, 0, 0, 0])?
  @assertion.assert_eq(bytes_to_array(encode_int(-1)), [255, 255, 255, 255])?
  @assertion.assert_eq(bytes_to_array(encode_int(-2)), [254, 255, 255, 255])?
}

test "encode_int" {
  @assertion.assert_eq(
    bytes_to_array(encode_int_part(1)),
    [2, 4, 4, 0, 0, 0, 1, 0, 0, 0],
  )?
  @assertion.assert_eq(
    bytes_to_array(encode_int_part(-1)),
    [2, 4, 4, 0, 0, 0, 255, 255, 255, 255],
  )?
}

test "encode primitives" {
  @assertion.assert_eq(bytes_to_array(encode_null_part()), [data_type_null])?
  @assertion.assert_eq(
    bytes_to_array(encode_boolean_part(true)),
    [data_type_boolean, 1],
  )?
  @assertion.assert_eq(
    bytes_to_array(encode_boolean_part(false)),
    [data_type_boolean, 0],
  )?
}

test "encode_string" {
  @assertion.assert_eq(
    bytes_to_array(encode_string("hello")),
    [104, 101, 108, 108, 111],
  )?
  @assertion.assert_eq(
    bytes_to_array(encode_string("こんにちは")),
    [227, 129, 147, 227, 130, 147, 227, 129, 171, 227, 129, 161, 227, 129, 175],
  )?
  @assertion.assert_eq(
    bytes_to_array(encode_string_item("こんにちは")),
    [
      1, 4, 15, 0, 0, 0, 227, 129, 147, 227, 130, 147, 227, 129, 171, 227, 129, 161,
      227, 129, 175,
    ],
  )?
}

test "encode_float" {
  let num = 3.14
  let bytes = encode_float(num)
  let expected = [31, 133, 235, 81, 184, 30, 9, 64]
  @assertion.assert_eq(bytes_to_array(bytes), expected)?
  @assertion.assert_eq(
    bytes_to_array(encode_float_part(num)),
    [3, 4, 8, 0, 0, 0, 31, 133, 235, 81, 184, 30, 9, 64],
  )?
}

test "encode_item" {
  @assertion.assert_eq(
    bytes_to_array(encode_part(Item::Int(1))),
    [2, 4, 4, 0, 0, 0, 1, 0, 0, 0],
  )?
  @assertion.assert_eq(
    bytes_to_array(encode_part(Item::Float(3.14))),
    [3, 4, 8, 0, 0, 0, 31, 133, 235, 81, 184, 30, 9, 64],
  )?
  @assertion.assert_eq(
    bytes_to_array(encode_part(Item::String("hello"))),
    [1, 4, 5, 0, 0, 0, 104, 101, 108, 108, 111],
  )?
  @assertion.assert_eq(bytes_to_array(encode_part(Item::Boolean(true))), [4, 1])?
  @assertion.assert_eq(
    bytes_to_array(encode_part(Item::Boolean(false))),
    [4, 0],
  )?
  @assertion.assert_eq(bytes_to_array(encode_part(Item::Null)), [5])?
}

test "encode_array" {
  @assertion.assert_eq(
    bytes_to_array(
      encode_part(Item::Array([Item::Int(1), Item::Int(2), Item::Int(3)])),
    ),
    [
      // data type
      6,
      // length
       4, 3, 0, 0, 0,
      // item: 0
       2, 4, 4, 0, 0, 0, 1, 0, 0, 0,
      // item: 1
       2, 4, 4, 0, 0, 0, 2, 0, 0, 0,
      // item: 2
       2, 4, 4, 0, 0, 0, 3, 0, 0, 0,
    ],
  )?
}

test "encode_object" {
  @assertion.assert_eq(
    bytes_to_array(
      encode_part(
        Item::Object(
          [("a", Item::Int(1)), ("b", Item::Int(2)), ("c", Item::Int(3))],
        ),
      ),
    ),
    [
      7, 4, 3, 0, 0, 0, 1, 4, 1, 0, 0, 0, 97, 2, 4, 4, 0, 0, 0, 1, 0, 0, 0, 1, 4,
      1, 0, 0, 0, 98, 2, 4, 4, 0, 0, 0, 2, 0, 0, 0, 1, 4, 1, 0, 0, 0, 99, 2, 4, 4,
      0, 0, 0, 3, 0, 0, 0,
    ],
  )?
}

/// --------- decode ----------

pub fn decode(bytes : Bytes) -> Item {
  let (item, _) = decode_part(bytes, 0)
  item
}

fn slice_bytes(bytes : Bytes, offset : Int, length : Int) -> Bytes {
  let buf = Bytes::make(length, 0)
  buf.blit(0, bytes, offset, length)
  buf
}

fn decode_int(bytes : Bytes) -> Int {
  // let buf = slice_bytes(bytes, 0, 4)
  bytes[0] + bytes[1].lsl(8) + bytes[2].lsl(16) + bytes[3].lsl(24)
}

fn array_to_bytes(array : Array[Int]) -> Bytes {
  let bytes = Bytes::make(array.length(), 0)
  for i = 0; i < array.length(); i = i + 1 {
    bytes[i] = array[i]
  }
  bytes
}

test "decode_int" {
  @assertion.assert_eq(decode_int(array_to_bytes([1, 0, 0, 0])), 1)?
  @assertion.assert_eq(decode_int(array_to_bytes([255, 0, 0, 0])), 255)?
  @assertion.assert_eq(decode_int(array_to_bytes([0, 1, 0, 0])), 256)?
  assert_decoder(Item::Int(65536))?
  assert_decoder(Item::Int(256))?
}

fn decode_length(bytes : Bytes, offset : Int) -> (Int, Int) {
  let len_size = bytes[offset]
  let len_bytes = slice_bytes(bytes, offset + 1, len_size)
  let len = decode_int(len_bytes)
  (len, offset + 1 + len_size)
}

fn decode_int_part(bytes : Bytes, offset : Int) -> (Item, Int) {
  // println("in decode_int_item")
  // println(bytes_to_array(bytes))
  let mut offset = offset
  let _data_type = bytes[offset]
  offset += 1
  let (len, end) = decode_length(bytes, offset)
  offset = end
  let val_slice = slice_bytes(bytes, offset, len)
  let value = decode_int(val_slice)
  (Item::Int(value), offset)
}

fn pow_double(base : Double, exp : Int) -> Double {
  let mut result = 1.0
  for i = 0; i < exp; i = i + 1 {
    result = result * base
  }
  result
}

let positive_infinity : Double = 0x7FF0000000000000L.reinterpret_as_double()

fn decode_float(bytes : Bytes) -> Double {
  let sign = if bytes[7].land(0x80) != 0 { -1.0 } else { 1.0 }
  let exponent = bytes[7].land(0x7F).lsl(4).lor(bytes[6].lsr(4)) - 1023
  let mantissa = bytes[6].land(0x0F).to_int64().lsl(48).lor(
    bytes[5].to_int64().lsl(40),
  ).lor(bytes[4].to_int64().lsl(32)).lor(bytes[3].to_int64().lsl(24)).lor(
    bytes[2].to_int64().lsl(16),
  ).lor(bytes[1].to_int64().lsl(8)).lor(bytes[0].to_int64())
  if exponent == 1024 {
    if mantissa == (0).to_int64() {
      return positive_infinity
    } else {
      // FIXME: 0x7FF0000000000001L is NaN
      return -1.0
    }
  }
  let normal_mantissa = 1.0 + mantissa.to_double() / pow_double(2.0, 52)
  return sign * normal_mantissa * pow_double(2.0, exponent)
}

fn decode_float_part(bytes : Bytes, offset : Int) -> (Item, Int) {
  let mut offset = offset
  let _data_type = bytes[offset]
  offset += 1
  let (len, end) = decode_length(bytes, offset)
  offset = end
  let val_slice = slice_bytes(bytes, offset, len)
  let value = decode_float(val_slice)
  (Item::Float(value), offset)
}

fn decode_part(bytes : Bytes, offset : Int) -> (Item, Int) {
  let data_type = bytes[0]
  if data_type == data_type_null {
    return (Item::Null, offset)
  }
  if data_type == data_type_boolean {
    let value = bytes[1] == 1
    return (Item::Boolean(value), offset + 1)
  }
  if data_type == data_type_float {
    return decode_float_part(bytes, offset)
  }
  if data_type == data_type_int {
    return decode_int_part(bytes, offset)
  }
  (Item::Null, offset)
}

fn assert_decoder(item : Item) -> Result[Unit, String] {
  @assertion.assert_eq(decode(encode(item)), item)?
  Ok(())
}

test "decode" {
  assert_decoder(Item::Null)?
  assert_decoder(Item::Boolean(true))?
  assert_decoder(Item::Boolean(false))?
}

test "decode_int" {
  // assert_decoder(Item::Int(0))?
  assert_decoder(Item::Int(1))?
  assert_decoder(Item::Int(-1))?
  assert_decoder(Item::Int(65536))?
}

test "decode_float" {
  assert_decoder(Item::Float(-1.0))?
  assert_decoder(Item::Float(3.14))?
  assert_decoder(Item::Float(5.5555))?
  assert_decoder(Item::Float(1000000.0))?
}
