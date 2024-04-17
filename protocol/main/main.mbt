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
  let input_decoded = @protocol.decode(input)
  match input_decoded {
    @protocol.Item::Array(fields) =>
      fields.iteri(fn(i, f) { println("item(\(i)): " + f.to_string()) })
    _ => println("not a struct")
  }
  let v = @protocol.encode(
    @protocol.Item::Array(
      [@protocol.Item::String("hello"), @protocol.Item::Int(42)],
    ),
  )
  io.write_output_bytes(v)
}

pub fn handle_struct_input(id : Int) -> Unit {
  let io = @js_io.from(id)
  let input = io.read_input_bytes()
  let input_decoded = @protocol.decode(input)
  match input_decoded {
    @protocol.Item::Object(fields) =>
      fields.iter(
        fn(f) {
          match f {
            (key, mem) => println("field: \(key) = " + mem.to_string())
          }
        },
      )
    _ => println("not a struct")
  }
  io.write_output_bytes(input)
}
