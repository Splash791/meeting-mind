import { useEffect, useState } from 'react';
import type { Notification as NotificationData } from '../hooks/useNotifications';

interface NotificationProps {
  notification: NotificationData;
}

export function Notification({ notification }: NotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(notification.visible);
  }, [notification.visible]);

  const getTriggerEmoji = (trigger: string) => {
    switch (trigger) {
      case 'gaze':
        return '👀';
      case 'blink':
        return '😴';
      case 'expression':
        return '😊';
      case 'headPose':
        return '🤔';
      default:
        return '💡';
    }
  };

  return (
    <>
      {isVisible && (
        <div
          className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-sm pointer-events-none transition-all duration-300 ${
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          <div className="bg-white rounded-lg shadow-2xl p-6 border-l-4 border-amber-500">
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{getTriggerEmoji(notification.trigger)}</span>
              <h3 className="text-lg font-semibold text-gray-900">MeetingMind</h3>
            </div>

            {/* Message */}
            <p className="text-gray-700 text-base leading-relaxed">{notification.message}</p>

            {/* Progress bar */}
            <div className="mt-4 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 animate-pulse"
                style={{
                  animation: 'shrink 5s linear forwards',
                }}
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </>
  );
}
