import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const s3 = new AWS.S3({
  accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY,
  secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_KEY,
  region: process.env.NEXT_PUBLIC_AWS_REGION
});

export const captureAndUploadImage = async (videoRef: React.RefObject<HTMLVideoElement>): Promise<string> => {
  if (!videoRef.current) return '';

  const canvas = document.createElement('canvas');
  canvas.width = videoRef.current.videoWidth;
  canvas.height = videoRef.current.videoHeight;
  
  const context = canvas.getContext('2d');
  if (!context) return '';
  
  context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
  
  // Convert to blob
  const blob = await new Promise<Blob>((resolve) => 
    canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.8)
  );

  const fileName = `captures/${uuidv4()}.jpg`;
  
  // Upload to S3
  const uploadResult = await s3.upload({
    Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME!,
    Key: fileName,
    Body: blob,
    ContentType: 'image/jpeg',
  }).promise();

  return uploadResult.Location;
};

export const startCaptureSession = async (
  videoRef: { current: HTMLVideoElement | null },
  meetingId: string,
  userId: string,
  onImagesProcessed: (imageUrls: string[]) => void
) => {
  const batchInterval = 10000; // 10 seconds
  const captureInterval = 2000; // 2 seconds (5 images in 10 seconds)
  let imageBuffer: string[] = [];
  let captureIntervalId: NodeJS.Timeout;
  let batchIntervalId: NodeJS.Timeout;

  const captureImage = async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    ctx.drawImage(videoRef.current, 0, 0);
    
    // Convert canvas to blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.8);
    });

    // Upload to S3
    const formData = new FormData();
    formData.append('image', blob);
    formData.append('meetingId', meetingId);
    formData.append('userId', userId);
    formData.append('timestamp', Date.now().toString());

    try {
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload image');
      
      const { url } = await response.json();
      console.log(url) 
      imageBuffer.push(url);
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const processBatch = () => {
    if (imageBuffer.length > 0) {
      onImagesProcessed([...imageBuffer]);
      imageBuffer = [];
    }
  };

  // Start capturing images every 2 seconds
  captureIntervalId = setInterval(captureImage, captureInterval);

  // Process batch every 10 seconds
  batchIntervalId = setInterval(processBatch, batchInterval);

  // Return cleanup function
  return () => {
    clearInterval(captureIntervalId);
    clearInterval(batchIntervalId);
    // Process any remaining images in the buffer
    if (imageBuffer.length > 0) {
      processBatch();
    }
  };
};