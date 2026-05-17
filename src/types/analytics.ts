export interface EngagementSnapshot {
  timestamp: number; // milliseconds
  score: number; // 0-100
  gaze: number; // 0-100
  blink: number; // 0-100
  expression: number; // 0-100
  headPose: number; // 0-100
}

export interface Session {
  id: string;
  startTime: number; // milliseconds
  endTime?: number;
  snapshots: EngagementSnapshot[];
  duration?: number; // milliseconds
  averageScore?: number; // 0-100
  triggerBreakdown?: {
    gaze: number; // percentage
    blink: number;
    expression: number;
    headPose: number;
  };
  topTrigger?: 'gaze' | 'blink' | 'expression' | 'headPose';
}

export interface AnalyticsData {
  sessions: Session[];
  currentSession?: Session;
  lastUpdated: number;
}

export interface TriggerInsight {
  trigger: 'gaze' | 'blink' | 'expression' | 'headPose';
  frequency: number; // percentage
  averageImpact: number; // how much it drops score
  recommendation: string;
}

export interface SessionInsight {
  type: 'temporal' | 'trigger' | 'behavioral' | 'trend';
  title: string;
  description: string;
  actionable?: string;
}
