import { useState, useCallback } from 'react';
import { AudioRecorder as AudioRecorderClass } from '@/lib/audioRecorder';

export default function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrls, setAudioUrls] = useState<string[]>([]);
  const [recorder] = useState(() => new AudioRecorderClass());
  const [id, setId] = useState('');
  const [chunkCounter, setChunkCounter] = useState(1);

  const handleStartRecording = useCallback(async () => {
    try {
      await recorder.startRecording(async (blob) => {
        const formData = new FormData();
        formData.append('audio', blob);
        formData.append('meetingId', id);
        formData.append('chunkNumber', chunkCounter.toString());

        const response = await fetch('/api/upload-audio', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload audio');
        }

        const { url } = await response.json();
        const audioUrl = URL.createObjectURL(blob);
        setAudioUrls(prev => [...prev, audioUrl]);
        setChunkCounter(prev => prev + 1);
      });
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, [recorder, id, chunkCounter]);

  const handleStopRecording = useCallback(() => {
    recorder.stopRecording();
    setIsRecording(false);
  }, [recorder]);

  return (
    <div className="p-4">
      <div className="flex gap-4 mb-4">
        {!isRecording ? (
          <button
            onClick={handleStartRecording}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Start Recording
          </button>
        ) : (
          <button
            onClick={handleStopRecording}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Stop Recording
          </button>
        )}
      </div>

      {audioUrls.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Recorded Audio Chunks:</h3>
          <div className="space-y-2">
            {audioUrls.map((url, index) => (
              <div key={url} className="flex items-center gap-2">
                <span className="font-medium">Chunk {index + 1}:</span>
                <audio controls src={url} className="max-w-full" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 