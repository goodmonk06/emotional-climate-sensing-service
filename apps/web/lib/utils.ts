// Utility functions

export function getSentimentEmoji(sentiment: number): string {
  if (sentiment >= 0.5) return '😊';
  if (sentiment >= 0.2) return '🙂';
  if (sentiment >= -0.2) return '😐';
  if (sentiment >= -0.5) return '😟';
  return '😢';
}

export function getSentimentLabel(sentiment: number): string {
  if (sentiment >= 0.5) return 'Very Positive';
  if (sentiment >= 0.2) return 'Positive';
  if (sentiment >= -0.2) return 'Neutral';
  if (sentiment >= -0.5) return 'Negative';
  return 'Very Negative';
}

export function getSentimentColor(sentiment: number): string {
  if (sentiment >= 0.5) return '#10b981'; // green
  if (sentiment >= 0.2) return '#84cc16'; // lime
  if (sentiment >= -0.2) return '#f59e0b'; // amber
  if (sentiment >= -0.5) return '#f97316'; // orange
  return '#ef4444'; // red
}

export function getEmotionEmoji(emotion: string): string {
  const emojiMap: Record<string, string> = {
    joy: '😄',
    sadness: '😢',
    anger: '😠',
    fear: '😨',
    surprise: '😲',
    disgust: '🤢',
    trust: '🤝',
    anticipation: '🎯',
    hope: '🌟',
    anxiety: '😰',
    excitement: '🎉',
    frustration: '😤',
    contentment: '😌',
    confusion: '😕',
    neutral: '😐'
  };
  return emojiMap[emotion.toLowerCase()] || '💭';
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
}
