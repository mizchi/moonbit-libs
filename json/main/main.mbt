struct Data {
  x : Int
  y : Bool
  z : String
} derive(Debug, Show)

// NOTE: this is imperfect. I need to get members by refrection
fn to_members(self : Data) -> Array[(String, @json.ToJson)] {
  [("x", self.x), ("y", self.y), ("z", self.z)]
}

fn Data::write_json_string(self : Data, buf : Buffer) -> Unit {
  let members = to_members(self)
  buf.write_string("{")
  members.iteri(
    fn(i, item) {
      let (key, val) = item
      buf.write_string(key)
      buf.write_string(": ")
      val.write_json_string(buf)
      if i < members.length() - 1 {
        buf.write_string(", ")
      }
    },
  )
  buf.write_string("}")
}

fn main {
  let input =
    #| {
    #|  "items": [1],
    #|  "nested": {
    #|    "items": [1, 2, 3, 4.5]
    #|  },
    #|  "items2": [{"a": 1}, {"b": 2}],
    #|  "next": null
    #| }

  let parsed = @json.parse(input).unwrap()
  println(parsed.stringify(spaces=2, newline=true))

  // array
  let x = [1, 2, 3]
  // to_json(x)
  println(@json.to_json(x))
  // map
  let map : @map.Map[String, Int] = @map.Map::[("a", 1), ("b", 2), ("c", 3)]
  println(@json.to_json(map))
  // custom data
  let data : Data = { x: 1, y: true, z: "hello" }
  let res3 = @json.to_json(data)
  println(res3)
  // let m = @hashmap.HashMap::[("a", 1), ("b", 2), ("c", 3)]
  // let x = @map.from_array(m)
}
