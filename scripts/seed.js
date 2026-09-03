import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getDatabase } from '../src/db/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export async function runSeeds(db = getDatabase()) {
  const seedsDir = path.join(__dirname, 'seeds')
  const files = fs.readdirSync(seedsDir).filter(f => f.endsWith('.sql')).sort()

  console.log(`Running ${files.length} seed file(s)...`)
  for (const file of files) {
    const filePath = path.join(seedsDir, file)
    const sql = fs.readFileSync(filePath, 'utf-8')
    db.exec(sql)
    console.log(`  Seeded: ${file}`)
  }
  console.log('Database seeding completed successfully.')
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runSeeds()
}
