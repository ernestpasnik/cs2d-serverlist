function loop(task, interval, onError, { immediate = true } = {}) {
  let stopped = false
  let timer = null
  let wake = null

  const delay = (elapsed) => (typeof interval === 'function' ? interval(elapsed) : Math.max(interval - elapsed, 0))
  const sleep = (ms) => new Promise((resolve) => {
    wake = resolve
    timer = setTimeout(resolve, ms)
  })

  const run = async () => {
    if (!immediate) await sleep(delay(0))
    while (!stopped) {
      const started = Date.now()
      try {
        await task()
      } catch (err) {
        onError(err)
      }
      if (stopped) break
      await sleep(delay(Date.now() - started))
    }
  }

  const done = run()

  return {
    stop() {
      stopped = true
      clearTimeout(timer)
      wake?.()
      return done
    }
  }
}

module.exports = { loop }
