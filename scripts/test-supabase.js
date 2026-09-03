import dotenv from 'dotenv'

dotenv.config()

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

console.log('='.repeat(60))
console.log('SUPABASE CONNECTION & SCHEMA VERIFICATION')
console.log('='.repeat(60))
console.log(`Supabase URL : ${url || '(not set in .env)'}`)
console.log(`API Key      : ${key ? key.slice(0, 12) + '...' : '(not set in .env)'}`)
console.log('-'.repeat(60))

if (!url || !key) {
  console.error('\n❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY in .env')
  console.log('Please configure your .env file with your Supabase credentials and re-run this script.')
  process.exit(1)
}

async function verify() {
  const tables = [
    'shops',
    'branches',
    'profiles',
    'product_categories',
    'products',
    'inventory',
    'orders',
    'order_items',
    'payments',
    'receipts',
    'queue_tickets',
    'activity_log',
  ]

  let successCount = 0
  let missingTables = []

  for (const table of tables) {
    try {
      const res = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      })

      if (res.ok) {
        const rows = await res.json()
        console.log(`  ✅ Table '${table}': Accessible (${rows.length} row sample found)`)
        successCount++
      } else if (res.status === 404 || res.status === 400) {
        console.log(`  ❌ Table '${table}': Not found or inaccessible (HTTP ${res.status})`)
        missingTables.push(table)
      } else {
        console.log(`  ⚠️ Table '${table}': HTTP ${res.status}`)
        missingTables.push(table)
      }
    } catch (err) {
      console.error(`\n❌ Network Error reaching Supabase: ${err.message}`)
      console.log('\nCommon causes:')
      console.log('1. Free tier Supabase project is PAUSED (Go to https://supabase.com/dashboard and click "Restore project").')
      console.log('2. The SUPABASE_URL in .env has a typo or is invalid.')
      console.log('3. Device is offline.')
      process.exit(1)
    }
  }

  console.log('-'.repeat(60))
  if (successCount === tables.length) {
    console.log('🎉 ALL TABLES ARE ACTIVE AND ACCESSIBLE IN SUPABASE!')
  } else if (successCount > 0) {
    console.log(`⚠️ Partial schema detected (${successCount}/${tables.length} tables active).`)
    console.log(`Missing tables: ${missingTables.join(', ')}`)
    console.log('\nTo create the remaining tables:')
    console.log('1. Open Supabase Dashboard -> SQL Editor')
    console.log('2. Paste the contents of scripts/supabase_master_schema.sql')
    console.log('3. Click "Run"')
  } else {
    console.log('❌ Connected to Supabase, but NONE of the POS tables exist yet.')
    console.log('\nTo set up your database:')
    console.log('1. Open Supabase Dashboard -> SQL Editor')
    console.log('2. Paste the contents of scripts/supabase_master_schema.sql')
    console.log('3. Click "Run"')
  }
}

verify()
