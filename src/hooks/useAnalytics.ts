import { useEffect, useRef, useState } from 'react';
import { storage } from '../utils/storage';
import type { Session, EngagementSnapshot, AnalyticsData } from '../types/analytics';
import type { EngagementScoreData } from './useEngagementScore';
import type { Signals } from './useSignals';

export function useAnalytics(
  isReady: boolean,
  scoreData: EngagementScoreData | null,
  signals: Signals | null
) {
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const currentSessionRef = useRef<Session | null>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize on mount: load existing sessions and create new session if camera ready
  useEffect(() => {
    const analytics = storage.getAnalytics();
    setAllSessions(analytics.sessions);

    if (isReady && !currentSessionRef.current) {
      console.log('Starting new analytics session');
      currentSessionRef.current = storage.createSession();
    }

    return () => {
      // Finalize session on unmount
      if (currentSessionRef.current) {
        const finalized = storage.finalizeSession(currentSessionRef.current);
        const analytics = storage.getAnalytics();
        analytics.sessions.push(finalized);
        storage.saveAnalytics(analytics);
        currentSessionRef.current = null;
      }
    };
  }, [isReady]);

  // Auto-save snapshots every 10 seconds
  useEffect(() => {
    if (!isReady || !scoreData || !signals || !currentSessionRef.current) {
      return;
    }

    const saveSnapshot = () => {
      if (!currentSessionRef.current) return;

      const snapshot: EngagementSnapshot = {
        timestamp: Date.now(),
        score: scoreData.score,
        gaze: Math.round(signals.gazeScore),
        blink: Math.round(signals.blinkScore),
        expression: Math.round(signals.expressionScore),
        headPose: Math.round(signals.headPoseScore),
      };

      currentSessionRef.current = storage.addSnapshot(
        currentSessionRef.current,
        snapshot
      );
    };

    // Save immediately, then every 10 seconds
    saveSnapshot();
    saveTimerRef.current = setInterval(saveSnapshot, 10000);

    return () => {
      if (saveTimerRef.current) {
        clearInterval(saveTimerRef.current);
      }
    };
  }, [isReady, scoreData, signals]);

  // Get current session (for real-time dashboard)
  const getCurrentSession = (): Session | null => {
    return currentSessionRef.current;
  };

  // Get all historical sessions
  const getAllSessions = (): Session[] => {
    return allSessions;
  };

  // Get sessions from last N days
  const getSessionsFromLastDays = (days: number): Session[] => {
    return storage.getSessionsFromLastDays(days);
  };

  // Get today's sessions
  const getTodaysSessions = (): Session[] => {
    return storage.getTodaysSessions();
  };

  return {
    currentSession: currentSessionRef.current,
    allSessions,
    getCurrentSession,
    getAllSessions,
    getSessionsFromLastDays,
    getTodaysSessions,
  };
}
