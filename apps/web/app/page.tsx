'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, ClimateSnapshot } from '@/lib/api';
import { getSentimentEmoji, getSentimentLabel, getSentimentColor, formatTimeAgo } from '@/lib/utils';

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<string[]>([]);
  const [snapshots, setSnapshots] = useState<Record<string, ClimateSnapshot | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCommunities();
  }, []);

  async function loadCommunities() {
    try {
      setLoading(true);
      const communityList = await api.getCommunities();
      setCommunities(communityList);

      // Load latest snapshot for each community
      const snapshotPromises = communityList.map(async (id) => {
        const snapshot = await api.getLatestSnapshot(id);
        return { id, snapshot };
      });

      const results = await Promise.all(snapshotPromises);
      const snapshotMap: Record<string, ClimateSnapshot | null> = {};
      results.forEach(({ id, snapshot }) => {
        snapshotMap[id] = snapshot;
      });

      setSnapshots(snapshotMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load communities');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading communities...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="text-red-600">Error: {error}</div>
        <button onClick={loadCommunities} className="btn btn-primary mt-4">
          Retry
        </button>
      </div>
    );
  }

  if (communities.length === 0) {
    return (
      <div className="card text-center">
        <p className="text-gray-600 mb-4">No communities found.</p>
        <p className="text-sm text-gray-500">
          Make sure to seed the database and create climate snapshots.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Communities</h2>
        <p className="text-gray-600">
          Monitor the emotional climate across your communities
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {communities.map((communityId) => {
          const snapshot = snapshots[communityId];
          const sentiment = snapshot?.aggregateSentiment || 0;

          return (
            <Link key={communityId} href={`/communities/${communityId}`}>
              <div className="card hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {communityId}
                  </h3>
                  <span className="text-4xl">{getSentimentEmoji(sentiment)}</span>
                </div>

                {snapshot ? (
                  <>
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          {getSentimentLabel(sentiment)}
                        </span>
                        <span className="text-sm font-medium" style={{ color: getSentimentColor(sentiment) }}>
                          {sentiment.toFixed(2)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${((sentiment + 1) / 2) * 100}%`,
                            backgroundColor: getSentimentColor(sentiment)
                          }}
                        />
                      </div>
                    </div>

                    <div className="text-sm text-gray-500 mb-3">
                      {formatTimeAgo(snapshot.windowEnd)}
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {snapshot.dominantEmotionsJson.slice(0, 3).map((emotion) => (
                        <span
                          key={emotion.emotion}
                          className="badge bg-blue-100 text-blue-800"
                        >
                          {emotion.emotion} {emotion.percentage.toFixed(0)}%
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-gray-500">
                    No snapshot available
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
