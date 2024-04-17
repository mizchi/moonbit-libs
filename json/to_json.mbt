// WIP
pub trait ToJson {
  write_json_string(Self, Buffer) -> Unit
}

pub fn ToJson::write_json_string(self : Int, buf : Buffer) -> Unit {
  buf.write_string(self.to_string())
}

pub fn ToJson::write_json_string(self : Bool, buf : Buffer) -> Unit {
  buf.write_string(self.to_string())
}

pub fn ToJson::write_json_string(self : String, buf : Buffer) -> Unit {
  buf.write_string(self.to_string())
}

pub fn ToJson::write_json_string[T : ToJson](
  self : Array[T],
  buf : Buffer
) -> Unit {
  buf.write_string("[")
  self.iteri(
    fn(i, item) {
      item.write_json_string(buf)
      if i < self.length() - 1 {
        buf.write_string(", ")
      }
    },
  )
  buf.write_string("]")
}

pub fn ToJson::write_json_string[T : ToJson](
  self : @map.Map[String, T],
  buf : Buffer
) -> Unit {
  buf.write_string("{")
  self.iteri(
    fn(i, key, val) {
      buf.write_string(key)
      buf.write_string(": ")
      val.write_json_string(buf)
      buf.write_string(", ")
      if i < self.size() - 1 {
        buf.write_string(", ")
      }
    },
  )
  buf.write_string("}")
}

pub fn to_json[X : ToJson](x : X) -> String {
  let buf = Buffer::make(10)
  x.write_json_string(buf)
  buf.to_string()
}
