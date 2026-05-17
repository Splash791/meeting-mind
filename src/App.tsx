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

function App() {
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
    <div className="w-full h-screen bg-gray-100 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">MeetingMind</h1>
        <p className="text-sm text-gray-600 mt-1">
          {faceMesh.error
            ? '⚠️ Camera access denied. Please check permissions.'
            : faceMesh.isReady && faceMesh.landmarks
            ? '🟢 Monitoring your engagement...'
            : '⏳ Initializing...'}
        </p>
      </div>

      {/* Main content: Two-column layout */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Left side: Camera (60%) */}
        <div className="flex-[0.6] flex flex-col items-center justify-center bg-white rounded-lg shadow-sm relative">
          {faceMesh.error ? (
            <div className="text-center">
              <p className="text-red-600 font-semibold">Camera Access Denied</p>
              <p className="text-gray-600 text-sm mt-2">
                Please allow camera access in your browser settings
              </p>
            </div>
          ) : faceMesh.isReady && scoreData ? (
            <>
              <WebcamView
                videoRef={faceMesh.videoRef as React.RefObject<HTMLVideoElement>}
                canvasRef={faceMesh.canvasRef as React.RefObject<HTMLCanvasElement>}
                isReady={faceMesh.isReady}
                error={faceMesh.error}
              />
              <EngagementHUD scoreData={scoreData} />
            </>
          ) : (
            <div className="text-center">
              <div className="inline-block">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
              <p className="text-gray-600 mt-4">Loading camera...</p>
            </div>
          )}
        </div>

        {/* Right side: Analytics Dashboard (40%) */}
        <div className="flex-[0.4] min-w-0">
          <AnalyticsDashboard
            currentSession={analytics.currentSession}
            allSessions={analytics.allSessions}
          />
        </div>
      </div>

      {/* Notification overlay */}
      <Notification notification={notificationData} />
    </div>
  );
}

export default App;
