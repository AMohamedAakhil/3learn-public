'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ClassScores {
  [student: string]: number;
}

interface LeaderboardData {
  classes: {
    [className: string]: ClassScores;
  };
}

export default function LeaderboardPage() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData>({ classes: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('https://w5zybg82zh6zka-8010.proxy.runpod.net/leaderboard');
        const data = await response.json();
        setLeaderboardData(data);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getClassRankings = (scores: ClassScores) => {
    return Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .map(([name, score], index) => ({
        rank: index + 1,
        name,
        score
      }));
  };

  if (loading) {
    return (
      <div className="flex size-full items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <section className="flex size-full flex-col gap-10 text-white">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <Link 
          href="/rewards" 
          className="rounded-lg bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600 transition-colors"
        >
          Claim Rewards
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {Object.entries(leaderboardData.classes).map(([className, scores]) => (
          <div key={className} className="bg-white/10 p-8 rounded-lg">
            <h2 className="text-2xl font-semibold mb-6 capitalize">
              {className.replace(/([A-Z])/g, ' $1').trim()}
            </h2>
            <div className="space-y-4">
              {getClassRankings(scores).map(({ rank, name, score }) => (
                <div
                  key={name}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-md hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <span className={`
                      text-lg font-bold
                      ${rank === 1 ? 'text-yellow-400' : 
                        rank === 2 ? 'text-gray-300' : 
                        rank === 3 ? 'text-amber-600' : 'text-gray-400'}
                    `}>
                      #{rank}
                    </span>
                    <span>{name}</span>
                  </div>
                  <span className="font-semibold">{score.toFixed(2)} pts</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
} 