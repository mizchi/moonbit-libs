import { expect } from 'https://deno.land/std@0.214.0/expect/mod.ts';
import $ from "jsr:@david/dax";

type Exports = Record<string, (...args: Array<number>) => number>;


async function compile(wat: string) {
  const temp = await Deno.makeTempFile({ suffix: ".wat" });
  const tempOut = await Deno.makeTempFile({ suffix: ".wasm" });
  await Deno.writeTextFile(temp, wat);
  await $`wat2wasm --enable-all ${temp} -o ${tempOut}`;
  return Deno.readFile(tempOut);
}

const wat = /*s*/ `
(module
  (func $i (import "imports" "imported_func") (param i32))
  (func (export "exported_func")
    i32.const 42
    call $i))
`;

{
  const { instance: { exports } } = await WebAssembly.instantiate(
    await compile(wat),
    {
      imports: {
        imported_func: (x: number) => console.assert(x === 42),
      },
    }
  );
  const api = exports as Exports;
  api.exported_func(2, 3);
}

const wat_acc = /*s*/ `
(module
  (memory (import "js" "mem") 1)
  (func (export "acc") (param $ptr i32) (param $len i32) (result i32)
    (local $end i32)
    (local $sum i32)
    (local.set $end
      (i32.add
        (local.get $ptr)
        (i32.mul
          (local.get $len)
          (i32.const 4))))
    (block $break
      (loop $top
        (br_if $break
          (i32.eq
            (local.get $ptr)
            (local.get $end)))
        (local.set $sum
          (i32.add
            (local.get $sum)
            (i32.load
              (local.get $ptr))))
        (local.set $ptr
          (i32.add
            (local.get $ptr)
            (i32.const 4)))
        (br $top)
      )
    )
    (local.get $sum)
  )
)
`;

{
  const binary = await compile(wat_acc);
  const mem = new WebAssembly.Memory({ initial: 1 });
  const { instance: { exports } } = await WebAssembly.instantiate(
    binary,
    { js: { mem } }
  );
  const api = exports as Exports;

  const i32 = new Uint32Array(mem.buffer);

  for (let i = 0; i < 10; i++) {
    i32[i] = i;
  }
  const out = api.acc(0, 10);

  console.assert(out === 45);
}

// simple read_memory
const wat_read_mem = /*s*/ `
(module
  (memory (import "js" "mem") 1)
  (func (export "read") (param $ptr i32) (result i32)
    (i32.load
      (local.get $ptr)
    )
  )
)
`;


{
  const binary = await compile(wat_read_mem);
  const mem = new WebAssembly.Memory({ initial: 1 });
  const { instance: { exports } } = await WebAssembly.instantiate(
    binary,
    { js: { mem } }
  );
  const api = exports as Exports;

  const i32 = new Uint32Array(mem.buffer);
  i32[0] = 5;
  const out = api.read(0);

  console.assert(out === 5);
}

// simple write_memory
const wat_read_store = /*s*/ `
(module
  (memory (import "js" "mem") 1)
  (func (export "write") (param $ptr i32) (param $val i32)
    (i32.store
      (local.get $ptr)  ;; アドレス
      (local.get $val)  ;; 書き込む値
    )
  )
)
`;

{
  const mem = new WebAssembly.Memory({ initial: 1 });
  const { instance: { exports } } = await WebAssembly.instantiate(
    await compile(wat_read_store),
    { js: { mem } }
  );
  const api = exports as Exports;
  api.write(0, 3);

  const i32 = new Uint32Array(mem.buffer);
  console.assert(i32[0] === 3);
}

const wat_tbl = /*s*/ `
(module
  (import "js" "tbl" (table 2 funcref))
  (func $f42 (result i32) i32.const 42)
  (func $f83 (result i32) i32.const 83)
  (elem (i32.const 0) $f42 $f83)
)
`;

{
  const tbl = new WebAssembly.Table({
    initial: 2,
    element: "anyfunc"
  });
  const { instance: { exports: _ } } = await WebAssembly.instantiate(
    await compile(wat_tbl),
    { js: { tbl } }
  );

  console.assert(tbl.get(0)?.() === 42);
  console.assert(tbl.get(1)?.() === 83);
}


// exported memory and write
const wat_write_exported = /*s*/ `
(module
  (memory (import "js" "mem") 1)
  (memory $mem (export "mem") 1)
  (func (export "write") (param $ptr i32) (param $val i32)
    (i32.store
      (local.get $ptr)  ;; アドレス
      (local.get $val)  ;; 書き込む値
    )
  )
)
`;

{
  const mem = new WebAssembly.Memory({ initial: 1 });
  const { instance: { exports } } = await WebAssembly.instantiate(
    await compile(wat_write_exported),
    { js: { mem } }
  );
  const api = exports as Exports & {
    mem: WebAssembly.Memory;
    mem2: WebAssembly.Memory;
  };
  api.write(0, 42);

  const buf1 = new Uint32Array(api.mem.buffer);
  console.log(buf1[0]);

  const buf2 = new Uint32Array(mem.buffer);
  console.log(buf2[0]);

  // console.assert(i32[0] === 42);
}

const wat_init_memory = /*s*/ `
(module
  (memory (export "mem") 1)
  (data $init_data "Hello World")
  (func $initialize_memory
    (memory.init $init_data (i32.const 0) (i32.const 0) (i32.const 11))  ;; コピーするデータの範囲を明示
  )
  (func $drop_data
    (data.drop $init_data)
  )
  (export "initialize_memory" (func $initialize_memory))
  (export "drop_data" (func $drop_data))
)
`;

{
  const { instance: { exports } } = await WebAssembly.instantiate(await compile(wat_init_memory));
  const api = exports as Exports & { mem: WebAssembly.Memory; };
  api.initialize_memory();
  const dataView = new DataView(api.mem.buffer);
  const length = 11; // "Hello World" の長さ
  let text = '';
  for (let i = 0; i < length; i++) {
    text += String.fromCharCode(dataView.getUint8(i));
  }
  console.log(text);
  api.drop_data();
  // api.initialize_memory(); // 呼ぶとエラー
}

const wat_init_memory2 = /*s*/ `
(module
  (memory (export "mem") 1)
  (data $init_data (i32.const 0) "Hello World")

  ;; メモリを初期化する関数
  (func $initialize_memory
    (memory.init $init_data (i32.const 0) (i32.const 0) (i32.const 11))
  )

  ;; データセグメントをドロップする関数
  (func $drop_data
    (data.drop $init_data)
  )

  ;; データの長さを返す関数
  (func (export "getDataLength") (result i32)
    i32.const 11  ;; "Hello World" の長さ
  )

  (export "initialize_memory" (func $initialize_memory))
  (export "drop_data" (func $drop_data))
)
`;

{
  const { instance: { exports } } = await WebAssembly.instantiate(await compile(wat_init_memory));
  const api = exports as Exports & { mem: WebAssembly.Memory; };
  api.initialize_memory();
  const dataView = new DataView(api.mem.buffer);
  const length = 11; // "Hello World" の長さ
  let text = '';
  for (let i = 0; i < length; i++) {
    text += String.fromCharCode(dataView.getUint8(i));
  }
  console.log(text); // Hello World
  api.drop_data();
  // api.initialize_memory(); // 呼ぶとエラー
}


const wat_io = /*s*/ `
(module
  ;; メモリの定義とエクスポート
  (memory (export "mem") 1)

  ;; オフセットと長さを格納するためのグローバル変数
  (global $srcOffset (mut i32) (i32.const 0))
  (global $length (mut i32) (i32.const 0))
  (global $resultOffset (mut i32) (i32.const 5)) ;; 結果のオフセットを初期設定

  ;; オフセット設定関数
  (func (export "setOffset") (param $offset i32)
    (global.set $srcOffset (local.get $offset))
  )

  ;; 長さ設定関数
  (func (export "setLength") (param $length i32)
    (global.set $length (local.get $length))
  )

  ;; データ処理関数
  (func (export "process")
    (local $i i32)
    (local.set $i (i32.const 0))
    (block $loop_exit
      (loop $loop
        (br_if $loop_exit
          (i32.ge_u (local.get $i) (global.get $length))
        )
        ;; データを新しいオフセットにコピー
        (i32.store8 
          (i32.add (global.get $resultOffset) (local.get $i))
          (i32.load8_u (i32.add (global.get $srcOffset) (local.get $i)))
        )
        (local.set $i (i32.add (local.get $i) (i32.const 1)))
        (br $loop)
      )
    )
  )

  ;; 結果オフセット取得関数
  (func (export "getResultOffset") (result i32)
    (global.get $resultOffset)
  )

  ;; 結果長さ取得関数
  (func (export "getResultLength") (result i32)
    (global.get $length)
  )
)
`;

{
  const { instance: { exports: { mem, setOffset, setLength, process, getResultOffset, getResultLength } } } = await WebAssembly.instantiate(await compile(wat_io)) as any;
  const buf = new Uint8Array(mem.buffer);
  buf[0] = 1;
  buf[1] = 2;
  buf[2] = 3;
  buf[3] = 4;
  setOffset(0);
  setLength(4);

  // ここで何らかの処理を行う
  // 今回は 0, 1, 2, 3 の 4 バイトを, 5, 6, 7, 8 コピーしたい
  process();

  const offset = getResultOffset(); // 5 が入っているはず
  const len = getResultLength(); // 4 が入っているはず

  // 中身を確認
  console.log(new Uint8Array(mem.buffer, offset, len));

}

const wat_convention = /*s*/ `
(module
  ;; メモリの定義とエクスポート
  (memory (export "mem") 1)

  ;; 処理後の結果のオフセットを格納するグローバル変数（初期値は5）
  (global $resultOffset (mut i32) (i32.const 5))

  ;; データ処理関数 - 入力オフセットと出力長さを引数で受け取り
  (func (export "process") (param $inputOffset i32) (param $outputLength i32) (result i32)
    (local $i i32)
    (local.set $i (i32.const 0))
    (block $loop_exit
      (loop $loop
        (br_if $loop_exit
          (i32.ge_u (local.get $i) (local.get $outputLength))
        )
        ;; 入力オフセットからデータを読み、結果のオフセットにデータをコピー
        (i32.store8 
          (i32.add (global.get $resultOffset) (local.get $i))
          (i32.load8_u (i32.add (local.get $inputOffset) (local.get $i)))
        )
        (local.set $i (i32.add (local.get $i) (i32.const 1)))
        (br $loop)
      )
    )
    ;; 結果のオフセットと長さをエンコードして返す
    (i32.or
      (i32.shl (global.get $resultOffset) (i32.const 16))
      (local.get $outputLength)
    )
  )
)
`;

{
  const { instance: { exports: { mem, process } } } = await WebAssembly.instantiate(await compile(wat_convention)) as any;
  const buf = new Uint8Array(mem.buffer);
  buf[0] = 1;
  buf[1] = 2;
  buf[2] = 3;
  buf[3] = 4;

  // ここで何らかの処理を行う
  // 今回は 0, 1, 2, 3 の 4 バイトを, 5, 6, 7, 8 コピーしたい
  const result = process(0, 4);
  const offset = result >> 16;    // 上位16ビットを取得
  const length = result & 0xFFFF;  // 下位16ビットを取得

  // 中身を確認
  console.log(new Uint8Array(mem.buffer, offset, length));
}


{
  // simple malloc
  const wat = /*s*/ `
(module
  (memory (export "mem") 1)  ;; メモリ定義（1ページ = 64KiB）

  ;; ヒープの次の空きアドレスを追跡するグローバル変数
  (global $heap_pointer (mut i32) (i32.const 0))  ;; データ領域などを考慮して、適切な開始位置を設定

  ;; メモリ割り当て関数 (malloc)
  (func (export "malloc") (param $size i32) (result i32)
    ;; 現在のヒープポインタをローカル変数に保存
    (local $current_offset i32)
    (local.set $current_offset (global.get $heap_pointer))
    
    ;; ヒープポインタを更新 (要求されたサイズだけ増やす)
    (global.set $heap_pointer
      (i32.add (global.get $heap_pointer) (local.get $size))
    )
    
    ;; 確保したメモリ領域のオフセットを返す
    (local.get $current_offset)
  )
)
`;
  const { instance: { exports: { mem, malloc } } } = await WebAssembly.instantiate(await compile(wat)) as any;
  const buf = new Uint8Array(mem.buffer);
  const offset1 = malloc(4);
  buf[offset1] = 1;
  buf[offset1 + 1] = 2;


  const offset2 = malloc(4);
  buf[offset2] = 5;
  buf[offset2 + 1] = 6;

  // console.log(new Uint8Array(mem.buffer));
}

{
  console.log("simple malloc and free");
  // simple malloc and free
  const wat = /*s*/ `
(module
  (memory (export "mem") 1)
  (global $heap_start (mut i32) (i32.const 0))
  (global $free_list_head (mut i32) (i32.const 0))

  (func $malloc (export "malloc") (param $size i32) (result i32)
    (local $ptr i32)
    ;; 確保する全サイズ（サイズ情報の格納分を含む）
    (local.set $ptr (global.get $heap_start))
    (global.set $heap_start (i32.add (global.get $heap_start) (i32.add (local.get $size) (i32.const 4))))
    ;; サイズ情報を格納
    (i32.store (local.get $ptr) (local.get $size))
    ;; 実際の利用可能アドレスを返す（サイズ情報分をオフセット）
    (i32.add (local.get $ptr) (i32.const 4))
  )

  (func $free (export "free") (param $ptr i32)
    ;; フリーリストに追加
    (i32.store (i32.sub (local.get $ptr) (i32.const 4)) (global.get $free_list_head))
    (global.set $free_list_head (i32.sub (local.get $ptr) (i32.const 4)))
  )
)
`;
  const { instance: { exports: { mem, malloc, free } } } = await WebAssembly.instantiate(await compile(wat)) as any;
  const buf = new Uint8Array(mem.buffer);
  const offset1 = malloc(4);
  buf[offset1 + 1] = 1;
  buf[offset1 + 2] = 2;
  buf[offset1 + 3] = 3;
  buf[offset1 + 4] = 4;

  free(offset1);
  console.log(new Uint8Array(mem.buffer));

  const offset2 = malloc(4);
  buf[offset2 + 5] = 5;
  buf[offset2 + 6] = 6;
  buf[offset2 + 7] = 7;
  buf[offset2 + 8] = 8;

  console.log(new Uint8Array(mem.buffer));


  // const offset2 = malloc(4);
  // buf[offset2] = 5;
  // buf[offset2 + 1] = 6;

  // console.log(new Uint8Array(mem.buffer));
}
