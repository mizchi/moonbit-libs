// Usage
pub fn write_hello() -> Int {
  let io = @js_io.IO::new()
  io.write_output("Hello, World!")
  io.id
}

pub fn echo(id : Int) -> Unit {
  let io = @js_io.IO::from(id)
  let input = io.read_input()
  io.write_output("echo " + input)
}
