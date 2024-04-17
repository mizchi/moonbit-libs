const js_regexp_buf = {
  patterns: [],
  input: [],
  output: [],
};
export const js_regexp = {
  new() {
    let id = js_regexp_buf.patterns.length;
    js_regexp_buf.patterns.push({
      expr: [],
      flags: [],
      compiled: null
    });
    return id;
  },
  write_pattern: (id, ch) => {
    js_regexp_buf.patterns[id].expr.push(ch)
  },
  write_pattern_flags: (id, ch) => {
    js_regexp_buf.patterns[id].flags.push(ch)
  },
  compile(id) {
    const pattern = js_regexp_buf.patterns[id];
    const patternStr = new TextDecoder("utf-16").decode(new Uint16Array(pattern.expr).valueOf());
    const flagsStr = new TextDecoder("utf-16").decode(new Uint16Array(pattern.flags).valueOf());
    const re = new RegExp(patternStr, flagsStr);
    pattern.compiled = re;
  },
  reset: () => {
    js_regexp_buf.input.length = 0;
  },
  write_input: (ch) => {
    js_regexp_buf.input.push(ch)
  },
  exec: (id) => {
    const input = new TextDecoder("utf-16").decode(new Uint16Array(js_regexp_buf.input).valueOf());
    const re = js_regexp_buf.patterns[id].compiled;
    const match = re.exec(input);
    if (match) {
      const itemsBytes = new TextEncoder("utf-16").encode([...match].join("\n"));
      js_regexp_buf.output.push(...itemsBytes);
    }
  },
  take_output: () => {
    const shifted = js_regexp_buf.output.shift();
    if (!shifted) return -1;
    return shifted;
  },
}