"use client";

import {
  CallControls,
  CallParticipantsList,
  CallStatsButton,
  CallingState,
  PaginatedGridLayout,
  useCall,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";

import { useEffect, useState } from "react";
import { redirect, useRouter, useSearchParams } from "next/navigation";

import { Button } from "./ui/button";
import EndCallButton from "./EndCallButton";
import MeetingNotes from "./MeetingNotes";
import { AudioRecorder } from "@/lib/audioRecorder";
import MeetingAnalytics from "../app/components/MeetingAnalytics";

import { Users, Check, Copy, FileText } from "lucide-react";

import { cn } from "@/lib/utils";
import { useMediaQuery } from "usehooks-ts";

import AWS from "aws-sdk";

type CallLayoutType = "grid" | "speaker-left" | "speaker-right";

const MeetingRoom = ({ id, user }: { id: string; user: any }) => {
  const isMobile = useMediaQuery("(max-width: 600px)");

  const router = useRouter();
  const searchParams = useSearchParams();
  const isPersonalRoom = Boolean(searchParams?.get("personal"));

  const [copied, setIsCopied] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const [layout, setLayout] = useState<CallLayoutType>("speaker-left");
  const [showParticipants, setShowParticipants] = useState(false);

  const { useCallCallingState, useLocalParticipant } = useCallStateHooks();
  const callingState = useCallCallingState();
  const localParticipant = useLocalParticipant();

  const url = `${window.origin}/meeting/${id}`;

  const call = useCall();

  const onCopy = () => {
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  // Audio recording logic
  useEffect(() => {
    let audioRecorder: AudioRecorder | null = null;
    let chunkCounter = 0;

    const uploadToServer = async (audioBlob: Blob) => {
      try {
        const formData = new FormData();
        formData.append('audio', audioBlob);
        formData.append('meetingId', id);
        formData.append('chunkNumber', chunkCounter.toString());

        const response = await fetch(`/api/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Upload failed');
        chunkCounter++;
      } catch (error) {
        console.error('Error uploading:', error);
      }
    };

    const startRecording = async () => {
      if (call?.state.createdBy?.id === user?.id) {
        audioRecorder = new AudioRecorder();
        await audioRecorder.startRecording((audioBlob) => {
          uploadToServer(audioBlob);
        }, 5000);
      }
    };

    if (callingState === CallingState.JOINED) {
      startRecording();
    }

    return () => {
      if (audioRecorder) {
        audioRecorder.stopRecording();
      }
    };
  }, [callingState, call?.state.createdBy?.id, user?.id, id]);

  const updateMemberList = async () => {
    await call?.updateCallMembers({ update_members: [{ user_id: user?.id }] });
  };

  useEffect(() => {
    if (callingState === CallingState.LEFT) return redirect("/");

    if (callingState === CallingState.JOINED) {
      updateMemberList();
    }
  }, [callingState]);

  return (
    <section className="relative h-screen w-full overflow-hidden pt-4 text-white">
      <div className="relative flex size-full items-center justify-center">
        <div className="flex size-full max-w-[1000px] items-center">
          <PaginatedGridLayout />
        </div>
        <div
          className={cn("h-[calc(100vh-86px)] hidden ml-2", {
            "show-block": showParticipants,
          })}
        >
          <CallParticipantsList onClose={() => setShowParticipants(false)} />
        </div>
        {showNotes && (
          <MeetingNotes
            meetingId={id}
            isOpen={showNotes}
            onClose={() => setShowNotes(false)}
          />
        )}
      </div>
      <div className="flex-wrap fixed bottom-0 flex w-full items-center justify-center gap-5">
        <CallControls onLeave={() => router.push("/")} />
        <CallStatsButton />
        <button onClick={() => setShowParticipants((prev) => !prev)}>
          {!isMobile && (
            <div className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]">
              <Users size={20} className="text-white" />
            </div>
          )}
        </button>
        <button onClick={() => setShowNotes((prev) => !prev)}>
          <div className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]">
            <FileText size={20} className="text-white" />
          </div>
        </button>
        <MeetingAnalytics
          meetingId={id}
          userId={user?.id ?? ''}
          isHost={call?.state.createdBy?.id === user?.id}
          participants={call?.state.members?.map(member => ({
            id: member.user_id,
            name: member.user?.name || member.user_id
          })) ?? []}
        />
        {!isMobile && (
          <Button
            className="rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b] transition-all"
            onClick={onCopy}
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" /> Copy Invite Link
              </>
            )}
          </Button>
        )}

        {!isPersonalRoom && <EndCallButton />}
      </div>
    </section>
  );
};

export default MeetingRoom;
