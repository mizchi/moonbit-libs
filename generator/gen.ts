export function* run(
  init: () => unknown,
  next: (g: unknown) => number
) {
  const g = init()
  while (true) {
    const status = next(g)
    if (status === 0) break
    yield next(g)
  }
}

