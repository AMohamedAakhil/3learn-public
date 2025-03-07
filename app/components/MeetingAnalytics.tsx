import { useEffect, useRef, useState } from 'react';
import { startCaptureSession } from '../utils/webcamCapture';
import { submitStudentImages } from '../services/analyticsService';
import ParticipantAnalytics from './ParticipantAnalytics';
import { useCallStateHooks, StreamVideoParticipant, Call, useCall } from "@stream-io/video-react-sdk";

interface MeetingAnalyticsProps {
  meetingId: string;
  userId: string;
  isHost: boolean;
  participants: Array<{
    id: string;
    name: string;
  }>;
}

export default function MeetingAnalytics({
  meetingId,
  userId,
  isHost,
  participants,
}: MeetingAnalyticsProps) {
  const [showAnalytics, setShowAnalytics] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);
  const { useLocalParticipant, useParticipants } = useCallStateHooks();
  const localParticipant = useLocalParticipant();
  const callParticipants = useParticipants();
  const call = useCall();

  useEffect(() => {
    if (isHost || !localParticipant || !call) return;

    const startCapture = async () => {
      try {
        // First ensure camera is enabled
        await call.camera.enable();
        
        // Get the camera stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });

        const videoTrack = stream.getVideoTracks()[0];

        if (!videoTrack) {
          console.error('No video track found - please check camera permissions');
          return;
        }

        const mediaStream = new MediaStream([videoTrack]);

        // Create a video element and set the track as its source
        const videoElement = document.createElement('video');
        videoElement.autoplay = true;
        videoElement.muted = true;
        videoElement.srcObject = mediaStream;

        // Wait for video to be ready
        await new Promise<void>((resolve) => {
          videoElement.onloadedmetadata = () => {
            videoElement.play().then(resolve);
          };
        });

        const videoRef = { current: videoElement };
        console.log("Starting capture with camera stream");
        
        const cleanup = await startCaptureSession(
          videoRef,
          meetingId,
          userId,
          async (imageUrls) => {
            try {
              await submitStudentImages(meetingId, userId, imageUrls);
            } catch (error) {
              console.error('Failed to submit images:', error);
            }
          }
        );

        cleanupRef.current = () => {
          cleanup();
          stream.getTracks().forEach(track => track.stop());
        };
      } catch (error) {
        console.error('Error in capture setup:', error);
        if (error instanceof Error) {
          if (error.name === 'NotAllowedError') {
            console.error('Camera permission denied');
          } else if (error.name === 'NotFoundError') {
            console.error('No camera found');
          }
        }
      }
    };

    // Start capture after a short delay to ensure tracks are ready
    const timeoutId = setTimeout(startCapture, 2000);

    return () => {
      clearTimeout(timeoutId);
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [meetingId, userId, isHost, localParticipant, call]);

  if (!isHost) return null;

  return (
    <>
      <button
        onClick={() => setShowAnalytics(true)}
        className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]"
      >
        <svg
          className="w-5 h-5 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      </button>

      <ParticipantAnalytics
        isOpen={showAnalytics}
        onClose={() => setShowAnalytics(false)}
        meetingId={meetingId}
        participants={participants}
        hostId={userId}
      />
    </>
  );
}