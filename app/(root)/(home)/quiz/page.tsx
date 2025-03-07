'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Meeting {
  id: string;
  date: string;
  notes?: {
    text: string;
    created_at: string;
  };
}

export default function QuizPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const response = await fetch('https://w5zybg82zh6zka-8010.proxy.runpod.net/class/meetings');
      const data = await response.json();
      
      const meetingsArray: Meeting[] = Object.entries(data.meetings).map(([id, date]) => ({
        id,
        date: date as string
      }));

      const meetingsWithNotes = await Promise.all(
        meetingsArray.map(async (meeting) => {
          try {
            const notesResponse = await fetch(`https://w5zybg82zh6zka-8010.proxy.runpod.net/class/${meeting.id}/notes`);
            if (notesResponse.ok) {
              const notesData = await notesResponse.json();
              return { ...meeting, notes: notesData.notes };
            }
          } catch (error) {
            console.error(`Error fetching notes for meeting ${meeting.id}:`, error);
          }
          return meeting;
        })
      );

      const validMeetings = meetingsWithNotes
        .filter(meeting => meeting.notes)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setMeetings(validMeetings);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      setLoading(false);
    }
  };

  const handleMeetingClick = (meetingId: string) => {
    router.push(`/quiz/${meetingId}`);
  };

  if (loading) {
    return (
      <section className="flex size-full flex-col gap-10 text-white">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex size-full flex-col gap-10 text-white">
      <h1 className="text-3xl font-bold">Available Quizzes</h1>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 overflow-hidden">
        {meetings.map((meeting) => (
          <div
            key={meeting.id}
            onClick={() => handleMeetingClick(meeting.id)}
            className="bg-white/10 p-6 rounded-lg hover:bg-white/20 transition-all cursor-pointer"
          >
            <div className="text-sm text-gray-300 mb-2">
              {new Date(meeting.date).toLocaleDateString()}
            </div>
            {meeting.notes && (
              <p className="text-gray-100 line-clamp-3">
                {meeting.notes.text}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
} 