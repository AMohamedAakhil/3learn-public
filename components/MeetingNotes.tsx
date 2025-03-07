"use client"

import { useEffect, useState } from 'react';
import { useCall, useCallStateHooks } from "@stream-io/video-react-sdk";
import { Button } from "./ui/button";
import ReactMarkdown from 'react-markdown';
import { Loader2 } from "lucide-react";

interface NoteResponse {
  notes: string;
}

const MeetingNotes = ({ meetingId, isOpen, onClose }: { 
  meetingId: string;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();
  const call = useCall();

  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`https://w5zybg82zh6zka-8010.proxy.runpod.net/class/${meetingId}/notes`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: NoteResponse = await response.json();
      setNotes(data.notes || '');
    } catch (error) {
      console.error('Error fetching notes:', error);
      setNotes('');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotes();
      const interval = setInterval(fetchNotes, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, meetingId]);

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-dark-1 p-4 shadow-lg border-l border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Meeting Notes</h2>
        <Button 
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white hover:bg-dark-2 rounded-full h-8 w-8 p-0"
        >
          ✕
        </Button>
      </div>
      <div className="h-[calc(100vh-100px)] overflow-y-auto">
        {isLoading && !notes && (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <p className="text-sm">Taking notes...</p>
          </div>
        )}
        {!isLoading && !notes && (
          <p className="text-gray-400 text-center">No notes available yet</p>
        )}
        {notes && (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{notes}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingNotes; 