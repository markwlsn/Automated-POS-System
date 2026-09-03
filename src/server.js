import { createApp } from './app.js'
import { env } from './config/env.js'
import { getDatabase, closeDatabase } from './db/index.js'
import { runMigrations } from '../scripts/migrate.js'
import { runSeeds } from '../scripts/seed.js'

async function startServer() {
  const db = getDatabase()
  await runMigrations(db)

  // Seed default data if database is fresh
  const profileCount = db.prepare('SELECT COUNT(*) as count FROM profiles').get()?.count || 0
  if (profileCount === 0) {
    console.log('Fresh database detected, running seeds...')
    await runSeeds(db)
  }

  const app = createApp()
  const server = app.listen(env.PORT, () => {
    console.log(`🚀 Automated POS API server running on http://localhost:${env.PORT}`)
    console.log(`   Health check: http://localhost:${env.PORT}/health`)
    console.log(`   Environment: ${env.NODE_ENV}`)
  })

  // Graceful shutdown
  function handleShutdown(signal) {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`)
    server.close(() => {
      closeDatabase()
      console.log('Server and database connections closed.')
      process.exit(0)
    })
  }

  process.on('SIGINT', () => handleShutdown('SIGINT'))
  process.on('SIGTERM', () => handleShutdown('SIGTERM'))
}

startServer().catch(err => {
  console.error('Fatal error starting server:', err)
  process.exit(1)
})
