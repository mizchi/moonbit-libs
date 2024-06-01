// from https://github.com/peter-jerry-ye/memory

extern "wasm" fn load8_ffi(pos : Int) -> Int =
  #|(func (param $pos i32) (result i32) (i32.load8_u (local.get $pos)))

extern "wasm" fn store8_ffi(pos : Int, value : Int) =
  #|(func (param $pos i32) (param $value i32) (i32.store8 (local.get $pos) (local.get $value)))

let buffer_offset : Ref[Int] = { val: 32768 }

pub fn set_buffer_offset(offset : Int) -> Unit {
  buffer_offset.val = offset
}

pub fn get_buffer_offset() -> Int {
  buffer_offset.val
}

pub fn read_buffer() -> Bytes {
  let offset = buffer_offset.val
  let len = read_length(offset)
  let bytes = Bytes::make(len)
  for i = 0; i < len; i = i + 1 {
    bytes[i] = load8_ffi(offset + 4 + i).to_byte()
  }
  bytes
}

pub fn read_string() -> String {
  decode_string(read_buffer())
}

pub fn write_buffer(bytes : Bytes) -> Unit {
  store_bytes(bytes, buffer_offset.val)
}

pub fn write_string(string : String) -> Unit {
  store_bytes(encode_string(string), buffer_offset.val)
}

// JavaScript's TextEncoder.encode
pub fn encode_string(s : String) -> Bytes {
  let result = []
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
  let bytes = Bytes::make(result.length())
  for i = 0; i < result.length(); i = i + 1 {
    bytes[i] = result[i].to_byte()
  }
  bytes
}

pub fn decode_string(bytes : Bytes) -> String {
  let mut result = ""
  let mut i = 0
  while i < bytes.length() {
    let byte = bytes[i]
    if byte < (0x80).to_byte() {
      // 1 byte character
      result += Char::from_int(byte.to_int()).to_string()
      i += 1
    } else if byte < (0xE0).to_byte() {
      // 2 byte character
      let code = byte.to_int().lsl(6).land(0x7FF) + bytes[i + 1].to_int().land(
          0x3F,
        )
      result += Char::from_int(code).to_string()
      i += 2
    } else if byte < (0xF0).to_byte() {
      // 3 byte character
      let code = byte.to_int().lsl(12).land(0xFFFF) + bytes[i + 1].to_int().lsl(
          6,
        ).land(0xFFF) + bytes[i + 2].to_int().land(0x3F)
      result += Char::from_int(code).to_string()
      i += 3
    } else {
      // 4 byte character
      let code = byte.to_int().lsl(18).land(0x1FFFFF) + bytes[i + 1].to_int().lsl(
          12,
        ).land(0x3FFFF) + bytes[i + 2].to_int().lsl(6).land(0xFFF) + bytes[i + 3].to_int().land(
          0x3F,
        )
      result += Char::from_int(code).to_string()
      i += 4
    }
  }
  result
}

// read byte length
fn read_length(offset : Int) -> Int {
  load8_ffi(offset) + load8_ffi(offset + 1).lsl(8) + load8_ffi(offset + 2).lsl(
    16,
  ) + load8_ffi(offset + 3).lsl(24)
}

fn store_bytes(bytes : Bytes, offset : Int) -> Unit {
  let byte_length = bytes.length()
  let int_bytes = int_to_bytes(byte_length)
  for i = 0; i < 4; i = i + 1 {
    store8_ffi(offset + i, int_bytes[i])
  }
  for i = 0; i < byte_length; i = i + 1 {
    store8_ffi(offset + 4 + i, bytes[i].to_int())
  }
}

fn int_to_bytes(value : Int) -> Array[Int] {
  [
    value.land(0xFF),
    value.lsr(8).land(0xFF),
    value.lsr(16).land(0xFF),
    value.lsr(24).land(0xFF),
  ]
}
