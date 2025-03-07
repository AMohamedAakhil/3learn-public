import { NextResponse } from 'next/server';
import AWS from 'aws-sdk';
import fetch from 'node-fetch';
import https from 'https';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioBlob = formData.get('audio') as Blob;
    const meetingId = formData.get('meetingId') as string;
    const chunkNumber = formData.get('chunkNumber') as string;

    const fileName = `meeting-${meetingId}-chunk-${chunkNumber}-${Date.now()}.wav`;
    
    const uploadResult = await s3.upload({
      Bucket: "hotfr",
      Key: fileName,
      Body: Buffer.from(await audioBlob.arrayBuffer()),
      ContentType: 'audio/wav',
      ACL: 'public-read'
    }).promise();

    const publicUrl = uploadResult.Location;

    // Forward to your notes endpoint
    const response = await fetch(
      `https://w5zybg82zh6zka-8010.proxy.runpod.net/class/${meetingId}/notes?audio_url=${encodeURIComponent(publicUrl)}`,
      {
        method: 'POST'
      }
    );

    if (!response.ok) {
      throw new Error(`Notes API responded with status: ${response.status}`);
    }

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
} 