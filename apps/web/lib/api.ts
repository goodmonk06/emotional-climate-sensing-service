// API client for Emotional Climate Service
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface DominantEmotion {
  emotion: string;
  count: number;
  percentage: number;
}

export interface ClimateSnapshot {
  id: string;
  communityId: string;
  windowStart: string;
  windowEnd: string;
  aggregateSentiment: number;
  dominantEmotionsJson: DominantEmotion[];
  summaryMarkdown: string;
  createdAt: string;
}

export interface AnalysisStats {
  total: number;
  analyzed: number;
  pending: number;
  analyzerInfo: {
    provider: string;
    model: string;
    version?: string;
  };
}

export const api = {
  // Get all communities
  async getCommunities(): Promise<string[]> {
    const res = await fetch(`${API_URL}/api/communities`);
    if (!res.ok) throw new Error('Failed to fetch communities');
    const data = await res.json();
    return data.communities;
  },

  // Get latest climate snapshot for a community
  async getLatestSnapshot(communityId: string): Promise<ClimateSnapshot | null> {
    const res = await fetch(`${API_URL}/api/communities/${communityId}/climate/latest`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to fetch snapshot');
    return res.json();
  },

  // Get climate history for a community
  async getSnapshotHistory(communityId: string, limit: number = 10): Promise<ClimateSnapshot[]> {
    const res = await fetch(`${API_URL}/api/communities/${communityId}/climate/history?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch history');
    const data = await res.json();
    return data.snapshots;
  },

  // Get analysis stats
  async getStats(): Promise<AnalysisStats> {
    const res = await fetch(`${API_URL}/api/analysis/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  // Trigger analysis processing
  async processAnalysis(limit: number = 50): Promise<any> {
    const res = await fetch(`${API_URL}/api/analysis/process?limit=${limit}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to process analysis');
    return res.json();
  },

  // Create a new snapshot
  async createSnapshot(communityId: string, windowHours: number = 24): Promise<ClimateSnapshot> {
    const res = await fetch(`${API_URL}/api/communities/${communityId}/climate/snapshot?windowHours=${windowHours}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to create snapshot');
    return res.json();
  }
};
