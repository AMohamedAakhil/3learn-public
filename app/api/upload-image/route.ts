import { NextResponse } from 'next/server';
import AWS from 'aws-sdk';

// Validate required environment variables
const requiredEnvVars = {
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION,
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET
};

// Check for missing environment variables
const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Initialize S3 client
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  signatureVersion: 'v4'
});

// Helper function to add CORS headers
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { 
    headers: corsHeaders(),
    status: 200 
  });
}

export async function POST(request: Request) {
  // Add CORS headers to response
  const headers = corsHeaders();

  try {
    const formData = await request.formData();
    const imageBlob = formData.get('image') as Blob;
    const meetingId = formData.get('meetingId') as string;
    const userId = formData.get('userId') as string;
    const timestamp = formData.get('timestamp') as string;

    // Validate required fields
    if (!imageBlob) {
      return NextResponse.json({ error: 'Missing image data' }, { status: 400, headers });
    }
    if (!meetingId) {
      return NextResponse.json({ error: 'Missing meetingId' }, { status: 400, headers });
    }
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400, headers });
    }
    if (!timestamp) {
      return NextResponse.json({ error: 'Missing timestamp' }, { status: 400, headers });
    }

    // Convert blob to buffer
    const buffer = Buffer.from(await imageBlob.arrayBuffer());
    const key = `meetings/${meetingId}/analytics/${userId}/${timestamp}.jpg`;

    try {
      const uploadResult = await s3.upload({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: key,
        Body: buffer,
        ContentType: 'image/jpeg',
        ACL: 'private' // Ensure files are private by default
      }).promise();

      return NextResponse.json({ 
        url: uploadResult.Location,
        key: uploadResult.Key
      }, { headers });
    } catch (uploadError) {
      console.error('S3 upload error:', uploadError);
      return NextResponse.json({ 
        error: 'Failed to upload to S3',
        details: uploadError instanceof Error ? uploadError.message : 'Unknown error'
      }, { status: 500, headers });
    }
  } catch (error) {
    console.error('Request processing error:', error);
    return NextResponse.json({ 
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500, headers });
  }
} 