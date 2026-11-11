function notFound(req, reply) {
  if (req.url.startsWith('/api')) return reply.code(404).send({ error: 'Not found' })
  return reply.code(404).view('404', { title: '404 Not Found', url: req.url })
}

module.exports = { notFound }
