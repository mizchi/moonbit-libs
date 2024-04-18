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
  let output = write_struct_inner(input_decoded)
  io.write_output_bytes(@protocol.encode(output))
}

fn write_struct_inner(item : @protocol.Item) -> @protocol.Item {
  match item {
    @protocol.Item::Array(fields) =>
      fields.iteri(fn(i, f) { println("item(\(i)): " + f.to_string()) })
    _ => println("not a struct")
  }
  @protocol.Item::Array(
    [@protocol.Item::String("hello"), @protocol.Item::Int(42)],
  )
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

pub fn encode_again(id : Int) -> Unit {
  let io = @js_io.from(id)
  let input = io.read_input_bytes()
  let decoded = @protocol.decode(input)
  let encoded = @protocol.encode(decoded)
  io.write_output_bytes(encoded)
}
// ----

pub fn with_validate(id : Int) -> Unit {
  let io = @js_io.from(id)
  let input = io.read_input_bytes()
  let decoded = @protocol.decode(input)
  match TypedInput::from_input(decoded) {
    Some(input) => {
      let out = with_validate_strict(input)
      let item = out.to_output()
      let encoded = @protocol.encode(item)
      io.write_output_bytes(encoded)
    }
    None =>
      // nothing
      ()
  }
}

fn with_validate_strict(input : TypedInput) -> TypedOutput {
  let x = input.x
  let y = input.y
  println("x: \(x), y: \(y)")
  { v: "ok" }
}

struct TypedInput {
  x : Int
  y : Int
}

trait ToOutput {
  to_output(Self) -> @protocol.Item
}

trait FromInput {
  from_input(@protocol.Item) -> Option[Self]
}

fn TypedInput::from_input(item : @protocol.Item) -> Option[TypedInput] {
  let mut x = 0
  let mut y = 0
  let mut initialized = false
  match item {
    @protocol.Item::Array([ @protocol.Item::Object(members), .. ]) =>
      members.iter(
        fn(member) {
          match member {
            ("x", @protocol.Item::Int(value)) => x = value
            ("y", @protocol.Item::Int(value)) => y = value
            _ => ()
          }
          initialized = true
        },
      )
    _ => ()
  }
  if initialized {
    Some(TypedInput::{ x, y })
  } else {
    None
  }
}

struct TypedOutput {
  v : String
}

fn TypedOutput::to_output(self : TypedOutput) -> @protocol.Item {
  @protocol.Item::Object([("v", @protocol.Item::String(self.v))])
}
