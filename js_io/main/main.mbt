pub fn set_buffer_offset(offset : Int) -> Unit {
  @js_io.set_buffer_offset(offset)
  ()
}

// Usage
pub fn write_bytes_test() -> Unit {
  let bytes = @js_io.read_buffer()
  for i = 0; i < bytes.length(); i = i + 1 {
    bytes[i] = (bytes[i].to_int() + 1).to_byte()
  }
  @js_io.write_buffer(bytes)
  ()
}

// Usage
pub fn write_string_test() -> Unit {
  let str = @js_io.read_string()
  @js_io.write_string(str + "!")
  ()
}
