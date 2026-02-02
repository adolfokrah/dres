/**
 * Script to clear collections before going live
 *
 * WARNING: This will permanently delete all data in the specified collections!
 * Make sure you have a backup before running this script.
 *
 * Usage: pnpm tsx scripts/clear-collections-for-launch.ts
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const COLLECTIONS_TO_CLEAR = [
  'styles',
  'variations',
  'skus',
  'orders',
  'reviews',
  'seller-sanctions',
  'carts',
  'transactions',
  'style-boosts',
  'user-points',
  'notifications',
  'stock-notifications',
  'variation-stats',
  'variation-views',
  'delivery-codes',
  'favorites',
] as const

async function clearCollections() {
  console.log('\n🚨 DANGER: This will delete ALL data from the following collections:')
  console.log(COLLECTIONS_TO_CLEAR.map(c => `   - ${c}`).join('\n'))
  console.log('\n')

  const payload = await getPayload({ config })

  const results: { collection: string; deleted: number; error?: string }[] = []

  for (const collection of COLLECTIONS_TO_CLEAR) {
    try {
      console.log(`🗑️  Clearing ${collection}...`)

      // First, count how many documents exist
      const { totalDocs } = await payload.find({
        collection: collection as any,
        limit: 0,
        depth: 0,
      })

      if (totalDocs === 0) {
        console.log(`   ✓ ${collection} is already empty`)
        results.push({ collection, deleted: 0 })
        continue
      }

      // Delete all documents in batches
      let deleted = 0
      const batchSize = 100

      while (deleted < totalDocs) {
        const docs = await payload.find({
          collection: collection as any,
          limit: batchSize,
          depth: 0,
        })

        if (docs.docs.length === 0) break

        for (const doc of docs.docs) {
          await payload.delete({
            collection: collection as any,
            id: doc.id,
            depth: 0,
          })
          deleted++
        }

        console.log(`   Deleted ${deleted}/${totalDocs}...`)
      }

      console.log(`   ✓ Deleted ${deleted} documents from ${collection}`)
      results.push({ collection, deleted })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`   ✗ Error clearing ${collection}: ${message}`)
      results.push({ collection, deleted: 0, error: message })
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(50))
  console.log('SUMMARY')
  console.log('='.repeat(50))

  let totalDeleted = 0
  let errors = 0

  for (const result of results) {
    if (result.error) {
      console.log(`❌ ${result.collection}: ERROR - ${result.error}`)
      errors++
    } else {
      console.log(`✅ ${result.collection}: ${result.deleted} deleted`)
      totalDeleted += result.deleted
    }
  }

  console.log('='.repeat(50))
  console.log(`Total deleted: ${totalDeleted}`)
  if (errors > 0) {
    console.log(`Errors: ${errors}`)
  }
  console.log('\n✨ Done!\n')

  process.exit(errors > 0 ? 1 : 0)
}

clearCollections().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
