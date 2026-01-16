import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'

async function main() {
  const payload = await getPayload({ config })
  
  const media = await payload.find({
    collection: 'media',
    limit: 5,
    depth: 0,
  })
  
  console.log('Sample media documents:\n')
  media.docs.forEach((doc, i) => {
    console.log(`--- Media ${i + 1}: ${doc.filename} ---`)
    console.log('  url:', doc.url)
    console.log('  sizes:', doc.sizes ? Object.keys(doc.sizes as object) : 'none')
    if (doc.sizes) {
      const sizes = doc.sizes as Record<string, any>
      const firstSize = Object.keys(sizes)[0]
      if (firstSize && sizes[firstSize]) {
        console.log(`  ${firstSize}.url:`, sizes[firstSize].url)
        console.log(`  ${firstSize}.filename:`, sizes[firstSize].filename)
      }
    }
    console.log('')
  })
  
  process.exit(0)
}
main()
