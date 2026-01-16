import 'dotenv/config'
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3'

const s3 = new S3Client({
  region: process.env.AWS_DEFAULT_REGION,
  endpoint: process.env.AWS_ENDPOINT_URL,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true,
})

async function main() {
  const bucket = process.env.AWS_S3_BUCKET_NAME || ''
  
  // List all objects
  const listResult = await s3.send(new ListObjectsV2Command({
    Bucket: bucket,
    MaxKeys: 1000,
  }))
  
  if (!listResult.Contents || listResult.Contents.length === 0) {
    console.log('Bucket is already empty!')
    return
  }
  
  console.log('Found', listResult.Contents.length, 'objects to delete')
  
  // Delete all objects
  const deleteResult = await s3.send(new DeleteObjectsCommand({
    Bucket: bucket,
    Delete: {
      Objects: listResult.Contents.map(obj => ({ Key: obj.Key })),
    },
  }))
  
  console.log('Deleted', deleteResult.Deleted?.length || 0, 'objects')
  console.log('Bucket is now empty!')
}

main().catch(console.error)
