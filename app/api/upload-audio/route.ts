import { NextResponse } from 'next/server';
import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioBlob = formData.get('audio') as Blob;
    const meetingId = formData.get('meetingId') as string;
    const chunkNumber = formData.get('chunkNumber') as string;

    if (!audioBlob || !meetingId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const buffer = Buffer.from(await audioBlob.arrayBuffer());
    const key = `meetings/${meetingId}/audio/chunk-${chunkNumber}.webm`;

    const uploadResult = await s3.upload({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: 'audio/webm',
    }).promise();

    return NextResponse.json({ url: uploadResult.Location });
  } catch (error) {
    console.error('Error uploading audio:', error);
    return NextResponse.json({ error: 'Failed to upload audio' }, { status: 500 });
  }
} 