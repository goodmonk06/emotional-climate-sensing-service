// Core types for Emotional Climate Sensing Service

export interface EmotionWeight {
  emotion: string;
  weight: number; // 0 to 1
}

export interface AnalysisResult {
  sentimentScore: number; // -1 to +1
  emotions: EmotionWeight[];
  intensityScore: number; // 0 to 1
  modelInfo?: {
    provider: string;
    model: string;
    version?: string;
  };
}

export interface DominantEmotion {
  emotion: string;
  count: number;
  percentage: number;
}

export interface ClimateData {
  aggregateSentiment: number;
  dominantEmotions: DominantEmotion[];
  signalCount: number;
  timeRange: {
    start: Date;
    end: Date;
  };
}

// Request/Response types for API
export interface IngestSignalRequest {
  sourceKey: string;
  communityId: string;
  externalMessageId?: string;
  authorRef?: string;
  text: string;
  ts: string | Date;
  meta?: Record<string, any>;
}

export interface IngestSignalResponse {
  success: boolean;
  signalId: string;
  message?: string;
}

export interface ClimateSnapshotResponse {
  id: string;
  communityId: string;
  windowStart: string;
  windowEnd: string;
  aggregateSentiment: number;
  dominantEmotions: DominantEmotion[];
  summaryMarkdown: string;
  createdAt: string;
}

export interface AnalysisJobResult {
  processed: number;
  failed: number;
  errors: Array<{ signalId: string; error: string }>;
}
