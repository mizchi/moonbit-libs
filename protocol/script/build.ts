import $ from "https://deno.land/x/dax@0.36.0/mod.ts";
$.setPrintCommand(true)
$.cd(Deno.cwd())
await $`moon build --target wasm-gc`
// await $`npx tsc -p .`