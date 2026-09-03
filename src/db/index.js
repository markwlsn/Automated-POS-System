import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'
import { env } from '../config/env.js'

let dbInstance = null

export function getDatabase(customPath) {
  if (dbInstance && !customPath) {
    return dbInstance
  }

  const dbPath = customPath || (env.NODE_ENV === 'test' ? ':memory:' : env.DB_PATH)

  if (dbPath !== ':memory:') {
    const dir = path.dirname(path.resolve(dbPath))
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  }

  const db = new DatabaseSync(dbPath)
  db.exec('PRAGMA foreign_keys = ON;')
  db.exec('PRAGMA journal_mode = WAL;')

  if (!customPath) {
    dbInstance = db
  }

  return db
}

export function closeDatabase() {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}
