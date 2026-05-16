import { useEffect, useState } from 'react';
import { useFaceMesh } from './hooks/useFaceMesh';
import { useSignals } from './hooks/useSignals';
import { useEngagementScore } from './hooks/useEngagementScore';
import { useNotifications } from './hooks/useNotifications';
import { WebcamView } from './components/WebcamView';
import { EngagementHUD } from './components/EngagementHUD';
import { Notification } from './components/Notification';

function App() {
  const [permissionsAsked, setPermissionsAsked] = useState(false);
  const faceMesh = useFaceMesh();
  const signals = useSignals(faceMesh.landmarks);
  const scoreData = useEngagementScore(signals);
  const notificationData = useNotifications(scoreData, signals);

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
    <div className="w-full h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
      {/* Main content area */}
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">MeetingMind</h1>
          <p className="text-gray-600 mb-6">
            {faceMesh.error
              ? 'Camera access denied. Please check permissions.'
              : faceMesh.isReady && faceMesh.landmarks
              ? 'Monitoring your engagement...'
              : 'Initializing...'}
          </p>

          {/* Info box */}
          {faceMesh.isReady && scoreData && (
            <div className="bg-white rounded-lg shadow-md p-4 max-w-sm mx-auto">
              <div className="text-sm text-gray-600 space-y-2">
                <div className="flex justify-between">
                  <span>Engagement Score:</span>
                  <span className="font-semibold">{scoreData.score}%</span>
                </div>
                {signals && (
                  <>
                    <div className="flex justify-between text-xs">
                      <span>Gaze:</span>
                      <span>{Math.round(signals.gazeScore)}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Blink Rate:</span>
                      <span>{Math.round(signals.blinkScore)}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Expression:</span>
                      <span>{Math.round(signals.expressionScore)}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Head Pose:</span>
                      <span>{Math.round(signals.headPoseScore)}%</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating UI components */}
      <WebcamView
        videoRef={faceMesh.videoRef as React.RefObject<HTMLVideoElement>}
        canvasRef={faceMesh.canvasRef as React.RefObject<HTMLCanvasElement>}
        isReady={faceMesh.isReady}
        error={faceMesh.error}
      />

      <EngagementHUD scoreData={scoreData} />

      <Notification notification={notificationData} />
    </div>
  );
}

export default App;
