fn js_set_timeout(fid : Int, timeout : Int) -> Int = "js" "setTimeout"

fn js_clear_timeout(tid : Int) -> Unit = "js" "clearTimeout"

fn js_set_interval(fid : Int, timeout : Int) -> Int = "js" "setInterval"

fn js_clear_interval(tid : Int) -> Unit = "js" "clearInterval"

type FnId Int derive(Eq)

pub fn FnId::hash(self : FnId) -> Int {
  self.0
}

type TimeoutId Int derive(Eq)

pub fn TimeoutId::new(i : Int) -> TimeoutId {
  TimeoutId(i)
}

pub fn TimeoutId::hash(self : TimeoutId) -> Int {
  self.0
}

type IntervalId Int derive(Eq)

pub fn IntervalId::new(i : Int) -> IntervalId {
  IntervalId(i)
}

pub fn IntervalId::hash(self : IntervalId) -> Int {
  self.0
}

let functions : @hashmap.HashMap[FnId, () -> Unit] = @hashmap.HashMap::[]

let timeout_ids : @hashmap.HashMap[TimeoutId, FnId] = @hashmap.HashMap::[]

let interval_ids : @hashmap.HashMap[IntervalId, FnId] = @hashmap.HashMap::[]

let fid : Ref[Int] = { val: 0 }

fn new_fid() -> FnId {
  let id = fid.val
  fid.val = fid.val + 1
  FnId(id)
}

pub fn fire(id : Int) -> Unit {
  // println("fire \(id)")
  match functions.get(FnId(id)) {
    Some(callback) => callback()
    None => println("function not found")
  }
}

pub fn set_timeout(cb : () -> Unit, ms : Int) -> TimeoutId {
  let fid = new_fid()
  println("set_timeout " + fid.0.to_string())
  functions.set(
    fid,
    fn() {
      cb()
      functions.remove(fid)
    },
  )
  let timeout_id = js_set_timeout(fid.0, ms)
  let tid = TimeoutId::new(timeout_id)
  timeout_ids.set(tid, fid)
  tid
}

pub fn clear_timeout(tid : TimeoutId) -> Unit {
  match timeout_ids.get(tid) {
    Some(fid) => {
      js_clear_timeout(tid.0)
      timeout_ids.remove(tid)
      functions.remove(fid)
      println("[mbt] timeout removed " + fid.0.to_string())
    }
    None => println("[mbt] timeout not found")
  }
}

pub fn set_interval(cb : () -> Unit, ms : Int) -> IntervalId {
  let fid = new_fid()
  // println("set_interval " + fid.0.to_string())
  functions.set(fid, cb)
  let id = js_set_interval(fid.0, ms)
  let iid = IntervalId::new(id)
  interval_ids.set(iid, fid)
  iid
}

pub fn clear_interval(id : IntervalId) -> Unit {
  match interval_ids.get(id) {
    Some(fid) => {
      js_clear_interval(id.0)
      interval_ids.remove(id)
      functions.remove(fid)
      println("[mbt] interval cleared" + fid.0.to_string())
    }
    None => println("[mbt] interval not found")
  }
}

pub fn run() -> Unit {
  let _t1 = set_timeout(
    fn() {
      println("[mbt] callback called")
      // xxx
    },
    100,
  )
  let t0 = set_timeout(
    fn() {
      println("[mbt] never called")
      // xxx
    },
    100,
  )
  clear_timeout(t0)
  let interval_id = set_interval(fn() { println("[mbt] interval called") }, 16)
  let _ = set_timeout(
    fn() {
      println("[mbt] clear interval")
      clear_interval(interval_id)
    },
    16 * 5,
  )

  // timout loop
  let mut cnt = 0
  let mut f : Option[() -> Unit] = None
  f = Some(
    fn() {
      let _ = set_timeout(
        fn() {
          cnt += 1
          // loop
          println("loop " + cnt.to_string())
          if cnt > 5 {
            f = None
            println("loop end")
            return ()
          }
          if f.is_empty().not() {
            let _ = set_timeout(f.unwrap(), 100)

          }
        },
        100,
      )

    },
  )
  f.unwrap()()
}

pub fn run_fetch() -> Unit {
  // TODO
}
