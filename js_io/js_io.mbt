fn jsio_create() -> Int = "js_io" "create"

fn jsio_read_input(id : Int) -> Int = "js_io" "read_input"

fn jsio_write_output(id : Int, code : Int) = "js_io" "write_output"

fn jsio_clear_input(id : Int) = "js_io" "clear_input"

fn jsio_clear_output(id : Int) = "js_io" "clear_output"

fn jsio_dispose(id : Int) = "js_io" "dispose"

pub struct IO {
  id : Int
}

pub fn read_input_string(self : IO) -> String {
  let mut result = ""
  while true {
    let code = jsio_read_input(self.id)
    if code == -1 {
      break
    }
    result += Char::from_int(code).to_string()
  }
  jsio_clear_input(self.id)
  result
}

pub fn read_input_bytes(self : IO) -> Bytes {
  let result = @vec.Vec::[]
  while true {
    let code = jsio_read_input(self.id)
    if code == -1 {
      break
    }
    result.push(code)
  }
  jsio_clear_input(self.id)
  let bytes = Bytes::make(result.length(), 0)
  for i = 0; i < result.length(); i = i + 1 {
    bytes[i] = result[i]
  }
  bytes
}

pub fn IO::new() -> IO {
  let id = jsio_create()
  { id, }
}

pub fn IO::from(id : Int) -> IO {
  { id, }
}

pub fn write_output_string(self : IO, text : String) -> Unit {
  for i = 0; i < text.length(); i = i + 1 {
    jsio_write_output(self.id, text[i].to_int())
  }
}

pub fn write_output_bytes(self : IO, bytes : Bytes) -> Unit {
  for i = 0; i < bytes.length(); i = i + 1 {
    jsio_write_output(self.id, bytes[i])
  }
}

pub fn clear_input(self : IO) -> Unit {
  jsio_clear_input(self.id)
}

pub fn clear_output(self : IO) -> Unit {
  jsio_clear_output(self.id)
}

pub fn dispose(self : IO) -> Unit {
  jsio_dispose(self.id)
}
