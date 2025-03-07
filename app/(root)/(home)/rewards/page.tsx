'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';

interface RewardItem {
  [key: string]: number;
}

interface RewardsResponse {
  message: string;
  class: string;
  rewards: RewardItem[];
}

export default function RewardsPage() {
  const { user } = useUser();
  const [selectedClass, setSelectedClass] = useState<'Science' | 'Maths'>('Science');
  const [availableRewards, setAvailableRewards] = useState<RewardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedReward, setSelectedReward] = useState<string>('');

  useEffect(() => {
    const fetchAvailableRewards = async () => {
      try {
        const response = await fetch(
          `https://w5zybg82zh6zka-8010.proxy.runpod.net/available-rewards/${selectedClass}`
        );
        const data: RewardsResponse = await response.json();
        setAvailableRewards(data.rewards);
      } catch (error) {
        console.error('Error fetching rewards:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableRewards();
  }, [selectedClass]);

  const handleClaimReward = async () => {
    if (!selectedReward) return;

    setSubmitting(true);
    console.log(JSON.stringify({
        class_id: selectedClass,
        student_name: user?.fullName || '',
        reward_name: selectedReward,
      }))
    try {
      const response = await fetch('https://w5zybg82zh6zka-8010.proxy.runpod.net/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          class_id: selectedClass,
          student_name: user?.fullName || '',
          reward_name: selectedReward,
        }),
      });

      if (response.ok) {
        alert('Reward claimed successfully!');
        setSelectedReward('');
      } else {
        alert('Failed to claim reward. Please try again.');
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
      alert('Error claiming reward. Please try again.');
    } finally {
      setSubmitting(false);
    }
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
        <h1 className="text-3xl font-bold">Claim Rewards</h1>
        <Link 
          href="/leaderboard" 
          className="rounded-lg bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600 transition-colors"
        >
          View Leaderboard
        </Link>
      </div>

      <div className="bg-white/10 p-8 rounded-lg">
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setSelectedClass('Science')}
            className={`rounded-lg px-4 py-2 font-semibold transition-colors ${
              selectedClass === 'Science'
                ? 'bg-blue-500 text-white'
                : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            Science
          </button>
          <button
            onClick={() => setSelectedClass('Maths')}
            className={`rounded-lg px-4 py-2 font-semibold transition-colors ${
              selectedClass === 'Maths'
                ? 'bg-blue-500 text-white'
                : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            Maths
          </button>
        </div>

        <div className="space-y-4">
          {availableRewards.map((reward, index) => {
            const [rewardName, points] = Object.entries(reward)[0];
            return (
              <div
                key={index}
                className={`flex cursor-pointer items-center justify-between p-4 rounded-md transition-all ${
                  selectedReward === rewardName
                    ? 'bg-blue-500/20'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
                onClick={() => setSelectedReward(rewardName)}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{rewardName}</span>
                  <span className="text-sm text-gray-400">{points} points required</span>
                </div>
                {selectedReward === rewardName && (
                  <span className="text-blue-400">✓</span>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={handleClaimReward}
          disabled={!selectedReward || submitting}
          className={`mt-6 w-full rounded-lg bg-blue-500 px-4 py-2 font-semibold text-white transition-colors
            ${
              !selectedReward || submitting
                ? 'cursor-not-allowed opacity-50'
                : 'hover:bg-blue-600'
            }`}
        >
          {submitting ? 'Claiming...' : 'Claim Selected Reward'}
        </button>
      </div>
    </section>
  );
} 