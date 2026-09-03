import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getDatabase } from '../src/db/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export async function runMigrations(db = getDatabase()) {
  const migrationsDir = path.join(__dirname, 'migrations')
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()

  console.log(`Running ${files.length} migration(s)...`)
  for (const file of files) {
    const filePath = path.join(migrationsDir, file)
    const sql = fs.readFileSync(filePath, 'utf-8')
    db.exec(sql)
    console.log(`  Applied: ${file}`)
  }
  console.log('Migrations completed successfully.')
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
}
