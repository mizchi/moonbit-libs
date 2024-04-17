pub fn echo(id : Int) -> Unit {
  let io = @js_io.from(id)
  let data = io.read_input_string()
  io.write_output_string("echo " + data)
}

pub fn echo_bytes(id : Int) -> Unit {
  let io = @js_io.from(id)
  let data = io.read_input_bytes()
  io.write_output_bytes(data)
}

pub fn write_struct(id : Int) -> Unit {
  let io = @js_io.from(id)
  let input = io.read_input_bytes()
  // TODO: moonbit protocol decoder
  let vec = @vec.Vec::[]
  for i = 0; i < input.length(); i = i + 1 {
    vec.push(input[i])
  }
  // println(vec)
  let v = @protocol.encode(
    @protocol.Item::Array(
      [@protocol.Item::String("hello"), @protocol.Item::Int(42)],
    ),
  )
  io.write_output_bytes(v)
}
