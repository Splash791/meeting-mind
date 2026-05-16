import { useEffect, useRef, useState } from 'react';
import { SIGNAL_WEIGHTS, ROLLING_WINDOW_SIZE } from '../constants';
import type { Signals } from './useSignals';

export interface EngagementScoreData {
  score: number;
  trend: 'up' | 'down' | 'stable';
  recentHistory: number[];
}

export function useEngagementScore(signals: Signals | null): EngagementScoreData | null {
  const [scoreData, setScoreData] = useState<EngagementScoreData | null>(null);
  const historyRef = useRef<{ timestamp: number; score: number }[]>([]);
  const lastScoreRef = useRef<number>(50);

  useEffect(() => {
    if (!signals) {
      setScoreData(null);
      return;
    }

    // Compute composite score from weighted signals
    const compositeScore =
      signals.gazeScore * SIGNAL_WEIGHTS.gaze +
      signals.blinkScore * SIGNAL_WEIGHTS.blinkRate +
      signals.expressionScore * SIGNAL_WEIGHTS.expression +
      signals.headPoseScore * SIGNAL_WEIGHTS.headPose;

    const clampedScore = Math.max(0, Math.min(100, compositeScore));

    // Add to history with timestamp
    const now = Date.now();
    historyRef.current.push({ timestamp: now, score: clampedScore });

    // Remove entries older than rolling window
    historyRef.current = historyRef.current.filter((entry) => now - entry.timestamp <= ROLLING_WINDOW_SIZE);

    // Calculate trend
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (historyRef.current.length > 1) {
      const firstScore = historyRef.current[0].score;
      const lastScore = historyRef.current[historyRef.current.length - 1].score;
      const diff = lastScore - firstScore;

      if (diff > 5) {
        trend = 'up';
      } else if (diff < -5) {
        trend = 'down';
      }
    }

    // Apply exponential moving average for smooth transitions
    const smoothingFactor = 0.2;
    const smoothedScore = lastScoreRef.current * (1 - smoothingFactor) + clampedScore * smoothingFactor;
    lastScoreRef.current = smoothedScore;

    // Get recent history for visualization
    const recentHistory = historyRef.current.map((entry) => entry.score);

    setScoreData({
      score: Math.round(smoothedScore),
      trend,
      recentHistory,
    });
  }, [signals]);

  return scoreData;
}
