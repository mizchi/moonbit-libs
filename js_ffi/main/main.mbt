pub fn echo(id : Int) -> Unit {
  let io = @js_io.from(id)
  let data = io.read_input_string()
  io.write_output_string("echo " + data)
}

pub fn echoBytes(id : Int) -> Unit {
  let io = @js_io.from(id)
  let data = io.read_input_bytes()
  io.write_output_bytes(data)
}
