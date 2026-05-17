import { useEffect, useRef, useState } from 'react';
import { ROLLING_WINDOW_SIZE } from '../constants';
import type { Signals } from './useSignals';
import { useSettings } from '../context/SettingsContext';

export interface EngagementScoreData {
  score: number;
  trend: 'up' | 'down' | 'stable';
  recentHistory: number[];
}

export function useEngagementScore(signals: Signals | null): EngagementScoreData | null {
  const [scoreData, setScoreData] = useState<EngagementScoreData | null>(null);
  const historyRef = useRef<{ timestamp: number; score: number }[]>([]);
  const lastScoreRef = useRef<number>(85);
  const { settings } = useSettings();

  useEffect(() => {
    if (!signals) {
      setScoreData(null);
      return;
    }

    // Fine-tuned threshold-based scoring
    let score = 95; // Start high - only deduct for poor engagement signals

    // Gaze: Most important signal (50% weight)
    if (settings.trackGaze) {
      const gazeScore = signals.gazeScore;
      if (gazeScore < 30) {
        score -= 35; // Severely looking away
      } else if (gazeScore < 50) {
        score -= 15; // Moderately off
      } else if (gazeScore < 70) {
        score -= 5; // Slightly off center
      }
      // gazeScore >= 70: no penalty (natural eye movement)
    }

    // Blink Rate: Healthy range is 12-20 blinks/min (30% weight)
    if (settings.trackBlinks) {
      const blinkScore = signals.blinkScore;
      if (blinkScore < 20) {
        // Too low - staring/closed eyes
        score -= 30;
      } else if (blinkScore < 40) {
        // Below healthy range but not critical
        score -= 10;
      } else if (blinkScore > 85) {
        // Excessive blinking (rare, indicates stress)
        score -= 10;
      }
      // blinkScore 40-85: no penalty (healthy blinking)
    }

    // Expression: Only penalize obvious negative expressions (15% weight)
    if (settings.trackExpressions) {
      const expressionScore = signals.expressionScore;
      if (expressionScore < 20) {
        // Severely frowning/negative
        score -= 20;
      } else if (expressionScore < 40) {
        // Moderately negative
        score -= 8;
      }
      // expressionScore >= 40: no penalty (neutral/positive is fine)
    }

    // Head Pose: Minimal weight, natural movement OK (5% weight)
    if (settings.trackHeadPose) {
      const headPoseScore = signals.headPoseScore;
      if (headPoseScore < 15) {
        // Significantly tilted/turned
        score -= 10;
      }
      // Minor head movements are natural and OK
    }

    // Ensure score stays 0-95 (95% is the realistic max for human attention)
    const clampedScore = Math.max(0, Math.min(95, score));

    const now = Date.now();
    historyRef.current.push({ timestamp: now, score: clampedScore });
    historyRef.current = historyRef.current.filter((entry) => now - entry.timestamp <= ROLLING_WINDOW_SIZE);

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

    const smoothingFactor = 0.2;
    const smoothedScore = lastScoreRef.current * (1 - smoothingFactor) + clampedScore * smoothingFactor;
    lastScoreRef.current = smoothedScore;

    const recentHistory = historyRef.current.map((entry) => entry.score);

    setScoreData({
      score: Math.round(smoothedScore),
      trend,
      recentHistory,
    });
  }, [signals, settings]);

  return scoreData;
}
