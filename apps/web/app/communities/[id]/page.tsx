'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api, ClimateSnapshot } from '@/lib/api';
import {
  getSentimentEmoji,
  getSentimentLabel,
  getSentimentColor,
  getEmotionEmoji,
  formatDate
} from '@/lib/utils';
import SentimentChart from '@/components/SentimentChart';
import EmotionChart from '@/components/EmotionChart';

export default function CommunityDetailPage() {
  const params = useParams();
  const communityId = params?.id as string;

  const [latest, setLatest] = useState<ClimateSnapshot | null>(null);
  const [history, setHistory] = useState<ClimateSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (communityId) {
      loadData();
    }
  }, [communityId]);

  async function loadData() {
    try {
      setLoading(true);
      const [latestSnapshot, historySnapshots] = await Promise.all([
        api.getLatestSnapshot(communityId),
        api.getSnapshotHistory(communityId, 20)
      ]);

      setLatest(latestSnapshot);
      setHistory(historySnapshots);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading community data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="text-red-600">Error: {error}</div>
        <button onClick={loadData} className="btn btn-primary mt-4">
          Retry
        </button>
      </div>
    );
  }

  if (!latest) {
    return (
      <div>
        <Link href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
          ← Back to Communities
        </Link>
        <div className="card text-center">
          <p className="text-gray-600 mb-2">No climate snapshot available for {communityId}</p>
          <p className="text-sm text-gray-500">
            Create a snapshot by analyzing signals first.
          </p>
        </div>
      </div>
    );
  }

  const sentiment = latest.aggregateSentiment;

  return (
    <div>
      <Link href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
        ← Back to Communities
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <span className="text-5xl">{getSentimentEmoji(sentiment)}</span>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{communityId}</h2>
            <p className="text-gray-600">
              {getSentimentLabel(sentiment)} climate
            </p>
          </div>
        </div>
      </div>

      {/* Current Climate Summary */}
      <div className="card mb-6">
        <h3 className="text-xl font-semibold mb-4">Current Climate</h3>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Aggregate Sentiment
            </span>
            <span className="text-lg font-bold" style={{ color: getSentimentColor(sentiment) }}>
              {sentiment.toFixed(3)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="h-3 rounded-full transition-all"
              style={{
                width: `${((sentiment + 1) / 2) * 100}%`,
                backgroundColor: getSentimentColor(sentiment)
              }}
            />
          </div>
        </div>

        <div className="prose max-w-none mb-4">
          <div
            dangerouslySetInnerHTML={{ __html: latest.summaryMarkdown.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
            className="text-gray-700"
          />
        </div>

        <div className="text-sm text-gray-500">
          Period: {formatDate(latest.windowStart)} - {formatDate(latest.windowEnd)}
        </div>
      </div>

      {/* Emotions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Dominant Emotions</h3>
          <div className="space-y-3">
            {latest.dominantEmotionsJson.map((emotion, index) => (
              <div key={emotion.emotion}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getEmotionEmoji(emotion.emotion)}</span>
                    <span className="font-medium text-gray-900 capitalize">
                      {emotion.emotion}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {emotion.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${emotion.percentage}%`,
                      backgroundColor: `hsl(${220 - index * 30}, 70%, 50%)`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Emotion Distribution</h3>
          <EmotionChart emotions={latest.dominantEmotionsJson} />
        </div>
      </div>

      {/* Sentiment Trend */}
      {history.length > 1 && (
        <div className="card mb-6">
          <h3 className="text-xl font-semibold mb-4">Sentiment Trend</h3>
          <SentimentChart snapshots={history} />
        </div>
      )}

      {/* Recent Snapshots */}
      {history.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Recent Snapshots</h3>
          <div className="space-y-3">
            {history.slice(0, 5).map((snapshot) => (
              <div
                key={snapshot.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {getSentimentEmoji(snapshot.aggregateSentiment)}
                  </span>
                  <div>
                    <div className="font-medium text-gray-900">
                      {getSentimentLabel(snapshot.aggregateSentiment)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(snapshot.windowEnd)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className="text-lg font-bold"
                    style={{ color: getSentimentColor(snapshot.aggregateSentiment) }}
                  >
                    {snapshot.aggregateSentiment.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
