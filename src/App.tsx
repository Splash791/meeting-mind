import { useEffect, useState } from 'react';
import { useFaceMesh } from './hooks/useFaceMesh';
import { useSignals } from './hooks/useSignals';
import { useEngagementScore } from './hooks/useEngagementScore';
import { useNotifications } from './hooks/useNotifications';
import { useAnalytics } from './hooks/useAnalytics';
import { WebcamView } from './components/WebcamView';
import { EngagementHUD } from './components/EngagementHUD';
import { Notification } from './components/Notification';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { SettingsPanel } from './components/SettingsPanel';
import { Activity, Settings } from 'lucide-react';

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [permissionsAsked, setPermissionsAsked] = useState(false);
  const faceMesh = useFaceMesh();
  const signals = useSignals(faceMesh.landmarks);
  const scoreData = useEngagementScore(signals);
  const notificationData = useNotifications(scoreData, signals);
  const analytics = useAnalytics(faceMesh.isReady, scoreData, signals);

  // Request notification permission on mount
  useEffect(() => {
    if (!permissionsAsked && 'Notification' in window) {
      const NotifAPI = window.Notification as any;
      if (NotifAPI.permission === 'default') {
        NotifAPI.requestPermission().catch(() => {
          // Permission denied or blocked - app continues without OS notifications
        });
      }
      setPermissionsAsked(true);
    }
  }, [permissionsAsked]);

  return (
    <div className="w-full h-screen bg-background overflow-hidden flex flex-col relative text-white">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-neon-green/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-neon-yellow/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="glass-panel border-x-0 border-t-0 px-8 py-5 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <Activity className="w-8 h-8 text-neon-green" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">MeetingMind</h1>
            <p className="text-xs text-white/50 font-mono tracking-widest uppercase mt-0.5">
              {faceMesh.error
                ? 'Camera access denied'
                : faceMesh.isReady && faceMesh.landmarks
                ? 'Monitoring Engagement'
                : 'Initializing Sensors'}
            </p>
          </div>
        </div>
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/10 cursor-pointer"
        >
          <Settings className="w-5 h-5 text-white/70" />
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 p-8 overflow-hidden z-10 flex">
        {/* We place Analytics Dashboard here. It might need a dark theme update later, but we wrap it in a dark container for now */}
        <div className="w-full max-w-3xl h-full mx-auto relative opacity-80 hover:opacity-100 transition-opacity duration-300">
           {/* Invert the Analytics Dashboard for a quick dark mode hack, or let it be. We'll wrap it nicely. */}
           <div className="absolute inset-0 bg-white/5 rounded-2xl overflow-hidden backdrop-blur-sm p-4 border border-surface-border mix-blend-screen">
             <AnalyticsDashboard
               currentSession={analytics.currentSession}
               allSessions={analytics.allSessions}
             />
           </div>
        </div>
      </div>

      {/* Floating HUD Elements */}
      <WebcamView
        videoRef={faceMesh.videoRef as React.RefObject<HTMLVideoElement>}
        canvasRef={faceMesh.canvasRef as React.RefObject<HTMLCanvasElement>}
        isReady={faceMesh.isReady}
        error={faceMesh.error}
        score={scoreData?.score}
      />
      
      {faceMesh.isReady && scoreData && (
        <EngagementHUD scoreData={scoreData} />
      )}

      {/* Notification overlay */}
      <Notification notification={notificationData} />

      {/* Settings Panel */}
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}

export default App;
