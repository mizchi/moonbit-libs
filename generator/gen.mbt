enum ReturningMode {
  Status
  Value
} derive(Eq)

struct Generator[T] {
  value : T
  mut returning : Int
  mut mode : ReturningMode // 0: status, 1: value
  next : (T) -> Option[Int]
}

fn Generator::new[T](initial : T, next : (T) -> Option[Int]) -> Generator[T] {
  { value: initial, returning: 0, mode: ReturningMode::Status, next }
}

fn next[T](self : Generator[T]) -> Int {
  if self.mode == ReturningMode::Status {
    self.mode = ReturningMode::Value
    let next = (self.next)(self.value)
    return match next {
      Some(returning) => {
        self.returning = returning
        1
      }
      None => 0
    }
  } else {
    self.mode = ReturningMode::Status
    self.returning
  }
}

// usages
struct Counter {
  mut value : Int
}

pub fn counter_init() -> Generator[Counter] {
  Generator::new(
    { value: 0 },
    fn(counter) {
      let v = counter.value
      if v >= 10 {
        return None
      }
      counter.value += 1
      Some(v)
    },
  )
}

pub fn counter_next(ctx : Generator[Counter]) -> Int {
  ctx.next()
}
