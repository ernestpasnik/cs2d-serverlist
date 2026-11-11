async function runPool(items, limit, worker, onError) {
  let next = 0
  const lane = async () => {
    while (next < items.length) {
      const item = items[next++]
      try {
        await worker(item)
      } catch (err) {
        onError?.(err, item)
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, lane))
}

module.exports = { runPool }
