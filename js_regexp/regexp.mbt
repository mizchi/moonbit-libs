/// JS:
///  const js_regexp_buf = {
///    patterns: [],
///    input: [],
///    output: [],
///  };
///  const js_regexp = {
///    new() {
///      let id = js_regexp_buf.patterns.length;
///      js_regexp_buf.patterns.push({
///        expr: [],
///        flags: [],
///        compiled: null
///      });
///      return id;
///    },
///    write_pattern: (id, ch) => {
///      js_regexp_buf.patterns[id].expr.push(ch)
///    },
///    write_pattern_flags: (id, ch) => {
///      js_regexp_buf.patterns[id].flags.push(ch)
///    },
///    compile(id) {
///      const pattern = js_regexp_buf.patterns[id];
///      const patternStr = new TextDecoder("utf-16").decode(new Uint16Array(pattern.expr).valueOf());
///      const flagsStr = new TextDecoder("utf-16").decode(new Uint16Array(pattern.flags).valueOf());
///      const re = new RegExp(patternStr, flagsStr);
///      pattern.compiled = re;
///    },
///    reset: () => {
///      js_regexp_buf.input.length = 0;
///    },
///    write_input: (ch) => {
///      js_regexp_buf.input.push(ch)
///    },
///    exec: (id) => {
///      const input = new TextDecoder("utf-16").decode(new Uint16Array(js_regexp_buf.input).valueOf());
///      const re = js_regexp_buf.patterns[id].compiled;
///      const match = re.exec(input);
///      if (match) {
///        const itemsBytes = new TextEncoder("utf-16").encode([...match].join("\n"));
///        js_regexp_buf.output.push(...itemsBytes);
///      }
///    },
///    take_output: () => {
///      const shifted = js_regexp_buf.output.shift();
///      if (!shifted) return -1;
///      return shifted;
///    },
///  }

fn js_regexp_reset() = "js_regexp" "reset"

fn js_regexp_new() -> Int = "js_regexp" "new"

fn js_regexp_write_pattern(id : Int, code : Int) = "js_regexp" "write_pattern"

fn js_regexp_write_pattern_flags(id : Int, code : Int) = "js_regexp" "write_pattern_flags"

fn js_regexp_compile(id : Int) = "js_regexp" "compile"

fn js_regexp_write_input(code : Int) = "js_regexp" "write_input"

fn js_regexp_take_output() -> Int = "js_regexp" "take_output"

fn js_regexp_exec(id : Int) = "js_regexp" "exec"

pub struct JsRegExp {
  id : Int
}

pub fn JsRegExp::new(pattern : String, ~flags : String = "") -> JsRegExp {
  let id = js_regexp_new()
  for i = 0; i < pattern.length(); i = i + 1 {
    js_regexp_write_pattern(id, pattern[i].to_int())
  }
  for i = 0; i < flags.length(); i = i + 1 {
    js_regexp_write_pattern_flags(id, flags[i].to_int())
  }
  js_regexp_compile(id)
  return JsRegExp::{ id, }
}

pub fn exec(self : JsRegExp, text : String) -> Option[Array[String]] {
  js_regexp_reset()
  for i = 0; i < text.length(); i = i + 1 {
    js_regexp_write_input(text[i].to_int())
  }
  // exec in js
  js_regexp_exec(self.id)
  let mut buf = ""
  while true {
    let char = js_regexp_take_output()
    if char == -1 {
      break
    }
    buf += Char::from_int(char).to_string()
  }
  if buf.length() == 0 {
    return None
  }

  // split array of strings by '\n' and join them with '\n' to get a string
  let items = []
  let mut current = ""
  for i = 0; i < buf.length(); i = i + 1 {
    let char = buf[i]
    if char == '\n' {
      items.push(current)
      current = ""
    } else {
      current += char.to_string()
    }
  }
  if current.length() > 0 {
    items.push(current)
  }
  Some(items.to_list().to_array())
}
