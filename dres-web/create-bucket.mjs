import { S3Client, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3'
import 'dotenv/config'

const s3Client = new S3Client({
  region: process.env.AWS_DEFAULT_REGION || 'local',
  endpoint: process.env.AWS_ENDPOINT_URL,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true, // Required for local S3-compatible storage
})

const bucketName = process.env.AWS_S3_BUCKET_NAME || 'dres-local'

async function createBucket() {
  try {
    // First check if bucket already exists
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }))
      console.log(`✅ Bucket '${bucketName}' already exists`)
      return
    } catch (error) {
      // Bucket doesn't exist, continue to create it
      if (error.name !== 'NotFound' && error.$metadata?.httpStatusCode !== 404) {
        throw error
      }
    }

    // Create the bucket
    const command = new CreateBucketCommand({
      Bucket: bucketName,
    })

    await s3Client.send(command)
    console.log(`✅ Successfully created S3 bucket: ${bucketName}`)
  } catch (error) {
    console.error('❌ Error creating bucket:', error)
    process.exit(1)
  }
}

createBucket()
