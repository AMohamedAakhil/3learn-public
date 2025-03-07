"use client";

import { useGetCallById } from "@/hooks/useGetCallById";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";

import { StreamCall, StreamTheme } from "@stream-io/video-react-sdk";

import MeetingSetup from "@/components/MeetingSetup";
import MeetingRoom from "@/components/MeetingRoom";
import Loader from "@/components/Loader";
import PermissionModal from "@/components/PermissionModal";

const Page = ({ params }: { params: { id: string } }) => {
  const { user, isLoaded } = useUser();

  const { call, isCallLoading } = useGetCallById(params.id);

  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  useEffect(() => {
    if (!isLoaded || isCallLoading) return;
    
    if (call?.state.createdBy?.id !== user?.id) {
      setShowPermissionModal(true);
    }
  }, [isLoaded, isCallLoading, call?.state.createdBy?.id, user?.id]);

  if (!isLoaded || isCallLoading) return <Loader />;

  if (!call)
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-center text-3xl font-bold text-white">
          Call Not Found
        </p>
      </div>
    );

  return (
    <main className="h-screen w-full">
      <StreamCall call={call}>
        <StreamTheme>
          {!isSetupComplete ? (
            <MeetingSetup setIsSetupComplete={setIsSetupComplete} />
          ) : (
            <>
              <MeetingRoom id={params.id} user={user} />
              {showPermissionModal && (
                <PermissionModal 
                  onAccept={async () => {
                    try {
                      // Request camera permission explicitly
                      await navigator.mediaDevices.getUserMedia({ video: true });
                      setShowPermissionModal(false);
                    } catch (error) {
                      console.error('Failed to get camera permission:', error);
                    }
                  }}
                  onDecline={() => {
                    setShowPermissionModal(false);
                    // Optionally handle decline case - maybe redirect or show warning
                  }}
                />
              )}
            </>
          )}
        </StreamTheme>
      </StreamCall>
    </main>
  );
};

export default Page;
