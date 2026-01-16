import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'
import * as fs from 'fs'

const uploadThingFiles = JSON.parse(fs.readFileSync('/Users/adolphus.okrah/Downloads/selected-rows.json', 'utf-8'))
const uploadThingNames = new Set(uploadThingFiles.map((f: any) => f.name))

async function main() {
  const payload = await getPayload({ config })
  
  const allMedia = await payload.find({
    collection: 'media',
    limit: 1000,
    depth: 0,
  })
  
  let found = 0
  let missing = 0
  const missingFiles: string[] = []
  
  for (const doc of allMedia.docs) {
    if (uploadThingNames.has(doc.filename)) {
      found++
    } else {
      missing++
      missingFiles.push(doc.filename)
    }
  }
  
  console.log('Database files found in UploadThing export:', found)
  console.log('Database files MISSING from export:', missing)
  console.log('')
  console.log('Missing files (need to export from UploadThing):')
  missingFiles.slice(0, 20).forEach(f => console.log('  -', f))
  if (missingFiles.length > 20) console.log('  ... and', missingFiles.length - 20, 'more')
  
  process.exit(0)
}
main()
