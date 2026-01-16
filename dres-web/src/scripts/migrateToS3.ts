/**
 * Migration Script: UploadThing to S3
 * 
 * This script:
 * 1. Reads the UploadThing export JSON file
 * 2. Downloads each file from UploadThing
 * 3. Uploads to your S3 bucket with the same filename
 * 
 * Usage:
 *   pnpm tsx src/scripts/migrateToS3.ts /path/to/selected-rows.json
 * 
 * Dry run (no uploads):
 *   DRY_RUN=true pnpm tsx src/scripts/migrateToS3.ts /path/to/selected-rows.json
 */

import 'dotenv/config'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import * as fs from 'fs'
import * as path from 'path'

const DRY_RUN = process.env.DRY_RUN === 'true'

interface UploadThingFile {
  name: string
  key: string
  url: string
  size: number
  uploadedAt: string
}

async function main() {
  const jsonPath = process.argv[2]
  
  if (!jsonPath) {
    console.error('❌ Usage: pnpm tsx src/scripts/migrateToS3.ts /path/to/selected-rows.json')
    process.exit(1)
  }
  
  console.log('🚀 Starting UploadThing to S3 migration...')
  console.log(`   Mode: ${DRY_RUN ? 'DRY RUN (no uploads)' : 'LIVE'}`)
  
  // Read the JSON file
  const jsonContent = fs.readFileSync(jsonPath, 'utf-8')
  const files: UploadThingFile[] = JSON.parse(jsonContent)
  
  console.log(`📊 Found ${files.length} files to migrate`)
  
  // Initialize S3 Client
  const s3Client = new S3Client({
    region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
    endpoint: process.env.AWS_ENDPOINT_URL,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
    forcePathStyle: true,
  })
  
  const bucket = process.env.AWS_S3_BUCKET_NAME || ''
  
  if (!bucket || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('❌ Missing required S3 environment variables')
    console.error('   Required: AWS_S3_BUCKET_NAME, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY')
    process.exit(1)
  }
  
  console.log(`   Bucket: ${bucket}`)
  console.log(`   Endpoint: ${process.env.AWS_ENDPOINT_URL}`)
  console.log('')
  
  let migrated = 0
  let failed = 0
  
  for (const file of files) {
    try {
      console.log(`📥 [${migrated + failed + 1}/${files.length}] ${file.name}`)
      
      if (DRY_RUN) {
        console.log(`   [DRY RUN] Would download from: ${file.url}`)
        console.log(`   [DRY RUN] Would upload to: media/${file.name}`)
        migrated++
        continue
      }
      
      // Download from UploadThing
      const response = await fetch(file.url)
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.status} ${response.statusText}`)
      }
      
      const buffer = Buffer.from(await response.arrayBuffer())
      const contentType = response.headers.get('content-type') || 'application/octet-stream'
      
      // Upload to S3 - NO prefix, just the filename (Payload's S3 adapter expects this)
      const s3Key = file.name
      
      await s3Client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: s3Key,
        Body: buffer,
        ContentType: contentType,
      }))
      
      console.log(`   ✅ Uploaded to S3: ${s3Key}`)
      migrated++
      
    } catch (error) {
      failed++
      console.error(`   ❌ Failed: ${error}`)
    }
  }
  
  console.log('')
  console.log('='.repeat(50))
  console.log('📊 Migration Summary:')
  console.log(`   ✅ Migrated: ${migrated}`)
  console.log(`   ❌ Failed: ${failed}`)
  console.log(`   📁 Total: ${files.length}`)
  console.log('='.repeat(50))
  
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error('Migration failed:', error)
  process.exit(1)
})
