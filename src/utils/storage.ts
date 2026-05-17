import { AnalyticsData, Session, EngagementSnapshot } from '../types/analytics';

const STORAGE_KEY = 'meetingmind_analytics';
const MAX_SESSIONS = 30; // Keep last 30 sessions (~1-2MB)

export const storage = {
  // Get all analytics data
  getAnalytics(): AnalyticsData {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        return { sessions: [], lastUpdated: Date.now() };
      }
      return JSON.parse(data);
    } catch (err) {
      console.error('Error reading analytics:', err);
      return { sessions: [], lastUpdated: Date.now() };
    }
  },

  // Save analytics data
  saveAnalytics(data: AnalyticsData): void {
    try {
      // Cap at MAX_SESSIONS, keeping newest ones
      if (data.sessions.length > MAX_SESSIONS) {
        data.sessions = data.sessions.slice(-MAX_SESSIONS);
      }
      data.lastUpdated = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('Error saving analytics:', err);
    }
  },

  // Create new session
  createSession(): Session {
    return {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: Date.now(),
      snapshots: [],
    };
  },

  // Add snapshot to session
  addSnapshot(session: Session, snapshot: EngagementSnapshot): Session {
    return {
      ...session,
      snapshots: [...session.snapshots, snapshot],
    };
  },

  // Finalize session (calculate stats)
  finalizeSession(session: Session): Session {
    const duration = Date.now() - session.startTime;

    if (session.snapshots.length === 0) {
      return { ...session, endTime: Date.now(), duration };
    }

    // Calculate average score
    const averageScore =
      session.snapshots.reduce((sum, s) => sum + s.score, 0) /
      session.snapshots.length;

    // Calculate trigger breakdown (which signal is lowest on average)
    const avgGaze =
      session.snapshots.reduce((sum, s) => sum + s.gaze, 0) /
      session.snapshots.length;
    const avgBlink =
      session.snapshots.reduce((sum, s) => sum + s.blink, 0) /
      session.snapshots.length;
    const avgExpression =
      session.snapshots.reduce((sum, s) => sum + s.expression, 0) /
      session.snapshots.length;
    const avgHeadPose =
      session.snapshots.reduce((sum, s) => sum + s.headPose, 0) /
      session.snapshots.length;

    const total = avgGaze + avgBlink + avgExpression + avgHeadPose;
    const triggerBreakdown = {
      gaze: Math.round((avgGaze / total) * 100),
      blink: Math.round((avgBlink / total) * 100),
      expression: Math.round((avgExpression / total) * 100),
      headPose: Math.round((avgHeadPose / total) * 100),
    };

    // Find top trigger (lowest score = biggest drag on engagement)
    const scores = [
      { trigger: 'gaze' as const, score: avgGaze },
      { trigger: 'blink' as const, score: avgBlink },
      { trigger: 'expression' as const, score: avgExpression },
      { trigger: 'headPose' as const, score: avgHeadPose },
    ];
    const topTrigger = scores.reduce((prev, curr) =>
      curr.score < prev.score ? curr : prev
    ).trigger;

    return {
      ...session,
      endTime: Date.now(),
      duration,
      averageScore: Math.round(averageScore),
      triggerBreakdown,
      topTrigger,
    };
  },

  // Get sessions from last N days
  getSessionsFromLastDays(days: number): Session[] {
    const analytics = this.getAnalytics();
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return analytics.sessions.filter((s) => s.startTime > cutoff);
  },

  // Get today's sessions
  getTodaysSessions(): Session[] {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return this.getSessionsFromLastDays(1);
  },

  // Clear all data
  clearAll(): void {
    localStorage.removeItem(STORAGE_KEY);
  },
};
