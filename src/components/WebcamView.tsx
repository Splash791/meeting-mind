import React from 'react';
import { motion, type PanInfo } from 'framer-motion';
import { GripHorizontal } from 'lucide-react';
import { useSettings, type Position } from '../context/SettingsContext';

interface WebcamViewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isReady: boolean;
  error: string | null;
  score?: number;
}

export function WebcamView({ videoRef, canvasRef, isReady, error, score = 50 }: WebcamViewProps) {
  const { settings, updateSettings } = useSettings();

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { point } = info;
    const { innerWidth, innerHeight } = window;
    
    const isTop = point.y < innerHeight / 2;
    const thirdWidth = innerWidth / 3;
    
    let newPos: Position = 'bottom-right';
    
    if (isTop) {
      if (point.x < thirdWidth) newPos = 'top-left';
      else if (point.x > thirdWidth * 2) newPos = 'top-right';
      else newPos = 'top-middle';
    } else {
      if (point.x < innerWidth / 2) newPos = 'bottom-left';
      else newPos = 'bottom-right';
    }
    
    updateSettings({ webcamPosition: newPos });
  };

  const positionClass = {
    'top-left': 'top-8 left-8',
    'top-right': 'top-8 right-8',
    'bottom-left': 'bottom-8 left-8',
    'bottom-right': 'bottom-8 right-8',
    'top-middle': 'top-8 left-1/2 -translate-x-1/2',
  }[settings.webcamPosition] || 'bottom-8 right-8';

  const getTheme = () => {
    if (!isReady) return 'border-surface-border shadow-none';
    if (score >= 70) return 'border-neon-green/50 shadow-[0_0_30px_rgba(0,255,148,0.15)]';
    if (score >= 40) return 'border-neon-yellow/50 shadow-[0_0_30px_rgba(255,214,0,0.15)]';
    return 'border-neon-red/50 shadow-[0_0_30px_rgba(255,51,102,0.15)]';
  };

  return (
    <motion.div 
      layout
      drag
      dragSnapToOrigin={true}
      onDragEnd={handleDragEnd}
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`fixed flex flex-col gap-3 z-40 cursor-grab active:cursor-grabbing ${positionClass}`}
    >
      <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-20 hover:opacity-100 transition-opacity z-50">
        <GripHorizontal className="w-5 h-5 text-white" />
      </div>
      <div className={`relative w-80 h-60 rounded-3xl overflow-hidden glass-panel border-[3px] transition-colors duration-700 ${getTheme()}`}>
        {!isReady ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-md">
            <div className="w-10 h-10 border-2 border-neon-green border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-white/60 text-[10px] font-mono uppercase tracking-[0.2em]">Initializing Feed</p>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-md">
            <div className="text-center p-6 border border-neon-red/30 rounded-xl bg-neon-red/5">
              <p className="text-neon-red text-sm font-semibold mb-2 tracking-widest uppercase">Camera Error</p>
              <p className="text-white/60 text-xs">{error}</p>
            </div>
          </div>
        ) : null}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={`absolute inset-0 w-full h-full object-cover mirror transition-opacity duration-1000 ${!isReady || error ? 'opacity-0' : 'opacity-100'}`}
          style={{ transform: 'scaleX(-1)' }}
        />

        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-1000 ${!isReady || error ? 'opacity-0' : 'opacity-100'}`}
          width={640}
          height={480}
        />

        {isReady && !error && (
          <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 shadow-lg">
            <div className="w-2 h-2 rounded-full bg-neon-green shadow-[0_0_8px_#00FF94] animate-pulse" />
            <span className="text-[10px] text-white/90 font-mono tracking-widest uppercase">Live</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
