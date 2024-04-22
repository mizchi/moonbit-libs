import { expect } from "jsr:@std/expect@0.223.0";
import { flush, js_string, setMemory, spectest } from "../.mooncakes/mizchi/js_io/mod.ts";

type MbtRef<T> = {
  type: "MbtRef";
  val: T;
};

type Instance = {
  fire: (fid: number) => void;
};

const initJs = () => {
  let instance: Instance;
  return {
    set<I extends Instance>(i: I) {
      instance = i;
    },
    setInterval: (fid: number, ms: number) => setInterval(() => instance.fire(fid), ms),
    clearInterval,
    setTimeout: (fid: number, ms: number) => setTimeout(() => instance.fire(fid), ms),
    clearTimeout,
    // async fetch(fid: number) {
    //   const text = await fetch(url).then(res => res.text())
    //   instance.fire(fid);
    // }
  }
}

const js = initJs();

const { instance: { exports } } = await WebAssembly.instantiateStreaming(
  fetch(new URL("../target/wasm-gc/release/build/main/main.wasm", import.meta.url)),
  { js_string, spectest, js }
);

const {
  run,
  fire,
  _start,
  ["moonbit.memory"]: memory,
} = exports as any;

_start();

setMemory(memory);
js.set({ fire });

// const memory = instance.exports['moonbit.memory'] as WebAssembly.Memory;
// remote write
// Deno.test("callback", () => {
// const cb = create_callback();
// fire(cb);
run();
expect(1).toBe(1);
flush();
// });