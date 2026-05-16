import { useState, useEffect } from 'react';
import { HUD_COLORS, COLOR_THRESHOLD } from '../constants';
import type { EngagementScoreData } from '../hooks/useEngagementScore';

interface EngagementHUDProps {
  scoreData: EngagementScoreData | null;
}

export function EngagementHUD({ scoreData }: EngagementHUDProps) {
  const [prevScore, setPrevScore] = useState<number>(50);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (!scoreData) return;

    // Trigger pulse animation on significant score change
    if (Math.abs(scoreData.score - prevScore) > 10) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 300);
      return () => clearTimeout(timer);
    }

    setPrevScore(scoreData.score);
  }, [scoreData?.score, prevScore]);

  if (!scoreData) {
    return (
      <div className="fixed top-6 right-6 text-gray-400 text-xs">
        Initializing...
      </div>
    );
  }

  const getColor = (score: number) => {
    if (score >= COLOR_THRESHOLD.high) return HUD_COLORS.high;
    if (score >= COLOR_THRESHOLD.medium) return HUD_COLORS.medium;
    return HUD_COLORS.low;
  };

  const getLabel = (score: number) => {
    if (score >= 70) return 'Engaged';
    if (score >= 50) return 'Fair';
    if (score >= 30) return 'Low';
    return 'Very Low';
  };

  const color = getColor(scoreData.score);
  const label = getLabel(scoreData.score);

  return (
    <div className="fixed top-6 right-6 flex items-center gap-4">
      {/* Score indicator */}
      <div
        className={`flex flex-col items-center justify-center w-24 h-24 rounded-full shadow-lg transition-all ${
          pulse ? 'scale-110' : 'scale-100'
        }`}
        style={{
          backgroundColor: color,
          boxShadow: `0 0 20px ${color}40`,
        }}
      >
        <div className="text-white font-bold text-3xl">{scoreData.score}%</div>
        <div className="text-white text-xs opacity-90 mt-1">{label}</div>
      </div>

      {/* Trend indicator */}
      <div className="flex flex-col items-center gap-1">
        {scoreData.trend === 'up' && (
          <div className="text-green-500 text-sm font-bold">↑</div>
        )}
        {scoreData.trend === 'down' && (
          <div className="text-red-500 text-sm font-bold">↓</div>
        )}
        {scoreData.trend === 'stable' && (
          <div className="text-yellow-600 text-sm font-bold">—</div>
        )}
        <div className="text-xs text-gray-500">{scoreData.trend}</div>
      </div>

      {/* Mini chart of recent history */}
      {scoreData.recentHistory.length > 0 && (
        <div className="flex items-end gap-0.5 h-16">
          {scoreData.recentHistory.slice(-20).map((score, idx) => (
            <div
              key={idx}
              className="w-1 transition-all duration-100"
              style={{
                height: `${(score / 100) * 64}px`,
                backgroundColor: getColor(score),
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
