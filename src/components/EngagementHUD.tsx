
import type { EngagementScoreData } from '../hooks/useEngagementScore';
import { motion, type PanInfo } from 'framer-motion';
import { GripHorizontal } from 'lucide-react';
import { useSettings, type Position } from '../context/SettingsContext';

interface EngagementHUDProps {
  scoreData: EngagementScoreData | null;
}

export function EngagementHUD({ scoreData }: EngagementHUDProps) {
  const { settings, updateSettings } = useSettings();

  if (!scoreData) {
    return (
      <div className="fixed top-8 right-8 text-white/50 text-xs tracking-widest font-mono uppercase">
        Initializing...
      </div>
    );
  }

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { point } = info;
    const { innerWidth, innerHeight } = window;
    const isLeft = point.x < innerWidth / 2;
    const isTop = point.y < innerHeight / 2;
    
    let newPos: Position = 'bottom-right';
    if (isTop && isLeft) newPos = 'top-left';
    if (isTop && !isLeft) newPos = 'top-right';
    if (!isTop && isLeft) newPos = 'bottom-left';
    if (!isTop && !isLeft) newPos = 'bottom-right';
    
    updateSettings({ hudPosition: newPos });
  };

  const positionClass = {
    'top-left': 'top-8 left-8',
    'top-right': 'top-8 right-8',
    'bottom-left': 'bottom-8 left-8',
    'bottom-right': 'bottom-8 right-8',
    'top-middle': 'top-8 right-8',
  }[settings.hudPosition] || 'top-8 right-8';

  const getColorTheme = (score: number) => {
    if (score >= 70) return { glow: 'shadow-[0_0_40px_rgba(0,255,148,0.2)]', stroke: '#00FF94', text: 'text-neon-green' };
    if (score >= 40) return { glow: 'shadow-[0_0_40px_rgba(255,214,0,0.2)]', stroke: '#FFD600', text: 'text-neon-yellow' };
    return { glow: 'shadow-[0_0_40px_rgba(255,51,102,0.2)]', stroke: '#FF3366', text: 'text-neon-red' };
  };

  const getLabel = (score: number) => {
    if (score >= 70) return 'ACTIVE ENGAGEMENT';
    if (score >= 40) return 'LOW ENGAGEMENT';
    return 'DISTRACTED';
  };

  const theme = getColorTheme(scoreData.score);
  const label = getLabel(scoreData.score);

  // SVG Progress circle calculations
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (scoreData.score / 100) * circumference;

  return (
    <motion.div 
      layout
      drag
      dragSnapToOrigin={true}
      onDragEnd={handleDragEnd}
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`fixed p-8 rounded-[2rem] glass-panel flex flex-col items-center gap-6 ${theme.glow} ${positionClass} transition-colors duration-700 w-72 z-40 cursor-grab active:cursor-grabbing`}
    >
      <div className="absolute top-3 opacity-20 hover:opacity-100 transition-opacity">
        <GripHorizontal className="w-5 h-5 text-white" />
      </div>
      <div className="relative w-40 h-40 flex items-center justify-center">
        {/* SVG Progress Ring */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60" cy="60" r={radius}
            fill="transparent"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="8"
          />
          <motion.circle
            cx="60" cy="60" r={radius}
            fill="transparent"
            stroke={theme.stroke}
            strokeWidth="8"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{ strokeDasharray: circumference }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold tracking-tighter text-white">
            {Math.round(scoreData.score)}<span className="text-2xl text-white/50">%</span>
          </span>
        </div>
      </div>
      
      <div className="text-center w-full">
        <p className={`text-sm font-semibold tracking-widest uppercase ${theme.text} transition-colors duration-500`}>
          {label}
        </p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <p className="text-white/40 text-[10px] font-mono uppercase tracking-widest">
            Trend
          </p>
          <span className={`text-[10px] font-bold ${
            scoreData.trend === 'up' ? 'text-neon-green' : 
            scoreData.trend === 'down' ? 'text-neon-red' : 
            'text-neon-yellow'
          }`}>
            {scoreData.trend === 'up' ? '↗' : scoreData.trend === 'down' ? '↘' : '→'}
          </span>
        </div>
      </div>

      {scoreData.recentHistory.length > 0 && (
        <div className="flex items-end gap-1 h-10 w-full justify-center px-4 mt-2">
          {scoreData.recentHistory.slice(-24).map((score, idx) => (
            <motion.div
              key={idx}
              initial={{ height: 0 }}
              animate={{ height: `${(score / 100) * 40}px` }}
              className="flex-1 max-w-[4px] rounded-t-sm transition-colors duration-300 opacity-60"
              style={{
                backgroundColor: getColorTheme(score).stroke,
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
