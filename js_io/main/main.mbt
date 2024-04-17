// Usage
pub fn write_hello() -> Int {
  let io = @js_io.IO::new()
  io.write_output_string("Hello, World!")
  io.id
}

pub fn write_bytes() -> Int {
  let io = @js_io.IO::new()
  let bytes = "xxx".to_bytes()
  io.write_output_bytes(bytes)
  io.id
}

pub fn echo(id : Int) -> Unit {
  let io = @js_io.IO::from(id)
  let input = io.read_input_string()
  io.write_output_string("echo " + input)
}
