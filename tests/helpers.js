import { getDatabase, closeDatabase } from '../src/db/index.js'
import { createApp } from '../src/app.js'
import { runMigrations } from '../scripts/migrate.js'
import { runSeeds } from '../scripts/seed.js'

export async function setupTestApp() {
  // Close any existing database instance and initialize fresh isolated DB
  closeDatabase()
  const db = getDatabase(':memory:')
  await runMigrations(db)
  await runSeeds(db)

  const app = createApp()

  // Start in-process server on an ephemeral free port
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s))
  })

  const port = server.address().port
  const baseUrl = `http://localhost:${port}`

  async function request(method, path, { body = null, token = null, headers = {} } = {}) {
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    }

    if (token) {
      reqHeaders['Authorization'] = `Bearer ${token}`
    }

    const options = {
      method,
      headers: reqHeaders,
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    const res = await fetch(`${baseUrl}${path}`, options)
    let data = null
    try {
      data = await res.json()
    } catch {
      data = null
    }

    return {
      status: res.status,
      ok: res.ok,
      body: data,
    }
  }

  function close() {
    return new Promise((resolve) => {
      server.close(() => {
        closeDatabase()
        resolve()
      })
    })
  }

  return {
    app,
    server,
    db,
    baseUrl,
    request,
    close,
  }
}
