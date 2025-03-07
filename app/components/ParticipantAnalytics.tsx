import { useState, useEffect } from 'react';
import { AnalyticsResponse, getAnalysisResults } from '../services/analyticsService';

interface ParticipantAnalyticsProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId: string;
  participants: Array<{
    id: string;
    name: string;
  }>;
  hostId: string;
}

export default function ParticipantAnalytics({
  isOpen,
  onClose,
  meetingId,
  participants,
  hostId,
}: ParticipantAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<Record<string, AnalyticsResponse>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;

    const nonHostParticipants = participants.filter(p => p.id !== hostId);
    
    // Clean up data for participants who have left
    setAnalyticsData(prev => {
      const newData = { ...prev };
      Object.keys(newData).forEach(participantId => {
        if (!participants.some(p => p.id === participantId)) {
          delete newData[participantId];
        }
      });
      return newData;
    });

    // Clean up loading and error states for departed participants
    setLoading(prev => {
      const newLoading = { ...prev };
      Object.keys(newLoading).forEach(participantId => {
        if (!participants.some(p => p.id === participantId)) {
          delete newLoading[participantId];
        }
      });
      return newLoading;
    });

    setError(prev => {
      const newError = { ...prev };
      Object.keys(newError).forEach(participantId => {
        if (!participants.some(p => p.id === participantId)) {
          delete newError[participantId];
        }
      });
      return newError;
    });

    // Set initial loading state for participants without existing data
    setLoading(prev => {
      const newLoading = { ...prev };
      nonHostParticipants.forEach(p => {
        if (!analyticsData[p.id]) {
          newLoading[p.id] = true;
        }
      });
      return newLoading;
    });

    const fetchAnalytics = async () => {
      console.log('Fetching analytics...', { meetingId, participants: nonHostParticipants });
      
      for (const participant of nonHostParticipants) {
        try {
          setLoading(prev => ({ ...prev, [participant.id]: !analyticsData[participant.id] }));
          setError(prev => ({ ...prev, [participant.id]: '' }));
          
          console.log(`Fetching analytics for ${participant.name}...`);
          const result = await getAnalysisResults(meetingId, participant.id);
          
          console.log(`Received analytics for ${participant.name}:`, result);
          
          // Only update if the timestamp is newer or there's no existing data
          setAnalyticsData(prev => {
            const existingData = prev[participant.id];
            if (!existingData || new Date(result.timestamp) > new Date(existingData.timestamp)) {
              return {
                ...prev,
                [participant.id]: result
              };
            }
            return prev;
          });
          
          setLoading(prev => ({ ...prev, [participant.id]: false }));
        } catch (error) {
          console.error(`Failed to fetch analytics for ${participant.name}:`, error);
          
          // Check if it's a 404 "Job not found" error
          const is404JobNotFound = 
            error instanceof Error && 
            'status' in error && 
            error.status === 404 && 
            error.toString().includes('Job not found');

          if (!is404JobNotFound) {
            // Only set error for non-404 "Job not found" errors
            setError(prev => ({
              ...prev,
              [participant.id]: error instanceof Error ? error.message : 'Failed to fetch analytics'
            }));
            setLoading(prev => ({ ...prev, [participant.id]: false }));
          }
          // For 404 "Job not found", keep loading state true and continue polling
        }
      }
    };

    // Initial fetch
    fetchAnalytics();

    // Set up interval
    const intervalId = setInterval(() => {
      console.log('Running interval fetch...');
      fetchAnalytics();
    }, 5000);

    // Cleanup
    return () => {
      console.log('Cleaning up interval...');
      clearInterval(intervalId);
      setLoading({});
      setError({});
    };
  }, [isOpen, meetingId, participants, hostId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-zinc-900 shadow-lg p-4 overflow-y-auto border-l border-zinc-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-zinc-100">Participant Analytics</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-6">
        {participants
          .filter(p => p.id !== hostId)
          .map((participant) => {
            const analytics = analyticsData[participant.id];
            const isLoading = loading[participant.id];
            const errorMessage = error[participant.id];

            return (
              <div key={participant.id} className="border border-zinc-700 rounded-lg p-4 bg-zinc-800/50">
                <h3 className="font-semibold mb-2 text-zinc-100">{participant.name}</h3>
                {errorMessage && !errorMessage.includes('404') ? (
                  <p className="text-red-400 text-sm">{errorMessage}</p>
                ) : isLoading && !analytics ? (
                  <div>
                    {errorMessage?.includes('404') ? (
                      <p className="text-emerald-400 text-sm">Initializing Student Analysis...</p>
                    ) : (
                      <p className="text-zinc-400">Fetching analytics...</p>
                    )}
                  </div>
                ) : analytics ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-zinc-800 p-2 rounded border border-zinc-700">
                        <p className="text-sm text-zinc-400">Attentiveness</p>
                        <p className="text-lg font-medium text-zinc-100">{analytics.attentiveness_rating}/10</p>
                      </div>
                      <div className="bg-zinc-800 p-2 rounded border border-zinc-700">
                        <p className="text-sm text-zinc-400">Eye Contact</p>
                        <p className="text-lg font-medium text-zinc-100">{analytics.eye_contact_score}/10</p>
                      </div>
                      <div className="bg-zinc-800 p-2 rounded border border-zinc-700">
                        <p className="text-sm text-zinc-400">Posture</p>
                        <p className="text-lg font-medium text-zinc-100">{analytics.posture_score}/10</p>
                      </div>
                      <div className="bg-zinc-800 p-2 rounded border border-zinc-700">
                        <p className="text-sm text-zinc-400">Focus Duration</p>
                        <p className="text-lg font-medium text-zinc-100">{analytics.focus_duration}s</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="font-medium text-zinc-300 mb-1">Latest Comment:</p>
                      <p className="text-sm text-zinc-400 whitespace-pre-line">{analytics.comment}</p>
                      <p className="text-xs text-zinc-500 mt-2">Updated: {new Date(analytics.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-green-400">Analyzing Student...</p>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
} 