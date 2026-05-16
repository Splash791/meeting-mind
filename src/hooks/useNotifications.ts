import { useEffect, useRef, useState } from 'react';
import { ENGAGEMENT_THRESHOLD, SUSTAINED_LOW_DURATION, NOTIFICATION_MESSAGES, AUDIO_CUE } from '../constants';
import type { EngagementScoreData } from './useEngagementScore';
import type { Signals } from './useSignals';

export interface Notification {
  visible: boolean;
  message: string;
  trigger: string;
}

export function useNotifications(
  scoreData: EngagementScoreData | null,
  signals: Signals | null
): Notification {
  const [notification, setNotification] = useState<Notification>({ visible: false, message: '', trigger: '' });
  const lowEngagementStartRef = useRef<number | null>(null);
  const notificationShownRef = useRef<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const notificationPermissionRef = useRef<NotificationPermission>('default');

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        notificationPermissionRef.current = 'granted';
      } else if (Notification.permission === 'denied') {
        notificationPermissionRef.current = 'denied';
      } else {
        Notification.requestPermission().then((permission) => {
          notificationPermissionRef.current = permission;
        });
      }
    }

    // Initialize audio context
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!scoreData || !signals) {
      return;
    }

    const isBelowThreshold = scoreData.score < ENGAGEMENT_THRESHOLD;

    if (isBelowThreshold) {
      // Start tracking low engagement
      if (!lowEngagementStartRef.current) {
        lowEngagementStartRef.current = Date.now();
      }

      const lowDuration = Date.now() - lowEngagementStartRef.current;

      // Trigger notification after sustained low engagement
      if (lowDuration >= SUSTAINED_LOW_DURATION && !notificationShownRef.current) {
        const trigger = determineTrigger(signals);
        const message = NOTIFICATION_MESSAGES[trigger as keyof typeof NOTIFICATION_MESSAGES] || NOTIFICATION_MESSAGES.general;

        // Show in-app notification
        setNotification({ visible: true, message, trigger });
        notificationShownRef.current = true;

        // Play audio cue
        playAudioCue();

        // Show OS notification if permission granted
        if (notificationPermissionRef.current === 'granted' && 'Notification' in window) {
          new Notification('MeetingMind', {
            body: message,
            icon: '/favicon.svg',
          });
        }

        // Auto-dismiss in-app notification after 5 seconds
        if (notificationTimeoutRef.current) {
          clearTimeout(notificationTimeoutRef.current);
        }
        notificationTimeoutRef.current = setTimeout(() => {
          setNotification({ visible: false, message: '', trigger: '' });
        }, 5000);
      }
    } else {
      // Reset low engagement tracking
      lowEngagementStartRef.current = null;
      notificationShownRef.current = false;
    }
  }, [scoreData, signals]);

  const playAudioCue = () => {
    if (!audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    const duration = AUDIO_CUE.duration / 1000; // convert to seconds
    const freq = AUDIO_CUE.frequency;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.frequency.value = freq;
      osc.type = 'sine';

      gain.gain.setValueAtTime(AUDIO_CUE.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (err) {
      console.error('Audio playback error:', err);
    }
  };

  return notification;
}

function determineTrigger(signals: Signals): 'gaze' | 'blink' | 'expression' | 'headPose' | 'general' {
  // Find the signal with the lowest score
  const scores = [
    { score: signals.gazeScore, trigger: 'gaze' as const },
    { score: signals.blinkScore, trigger: 'blink' as const },
    { score: signals.expressionScore, trigger: 'expression' as const },
    { score: signals.headPoseScore, trigger: 'headPose' as const },
  ];

  scores.sort((a, b) => a.score - b.score);
  const lowestSignal = scores[0];

  // Only attribute to a specific signal if it's significantly lower
  if (lowestSignal.score < 50) {
    return lowestSignal.trigger;
  }

  return 'general';
}
