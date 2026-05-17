import { useEffect, useRef, useState } from 'react';
import { SUSTAINED_LOW_DURATION, NOTIFICATION_MESSAGES, AUDIO_CUE } from '../constants';
import type { EngagementScoreData } from './useEngagementScore';
import type { Signals } from './useSignals';
import { useSettings } from '../context/SettingsContext';

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
  const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notificationPermissionRef = useRef<NotificationPermission>('default');
  
  const { settings, audioUnlocked } = useSettings();

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

    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  // Only init audio context once user unlocks it via settings test
  useEffect(() => {
    if (audioUnlocked && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, [audioUnlocked]);

  useEffect(() => {
    if (!scoreData || !signals) {
      return;
    }

    const isBelowThreshold = scoreData.score < settings.engagementThreshold;

    if (isBelowThreshold) {
      if (!lowEngagementStartRef.current) {
        lowEngagementStartRef.current = Date.now();
      }

      const lowDuration = Date.now() - lowEngagementStartRef.current;

      if (lowDuration >= SUSTAINED_LOW_DURATION && !notificationShownRef.current) {
        const trigger = determineTrigger(signals);
        const message = NOTIFICATION_MESSAGES[trigger as keyof typeof NOTIFICATION_MESSAGES] || NOTIFICATION_MESSAGES.general;

        setNotification({ visible: true, message, trigger });
        notificationShownRef.current = true;

        if (settings.audioEnabled && audioUnlocked) {
          playAudioCue();
        }

        // Send macOS native notification (works in background)
        if (notificationPermissionRef.current === 'granted' && 'Notification' in window) {
          try {
            const notification = new Notification('MeetingMind Alert', {
              body: message,
              icon: '/favicon.svg',
              tag: 'engagement-alert', // Replace previous notification instead of stacking
              requireInteraction: false, // Auto-dismiss (don't require user click)
              // macOS specific - these might not work in all browsers but don't hurt
              badge: '/favicon.svg',
              silent: false, // Play system sound
            });

            // Keep notification visible longer on macOS (system controls actual duration)
            notification.onclick = () => {
              window.focus();
              notification.close();
            };
          } catch (err) {
            console.error('Failed to send notification:', err);
          }
        }

        if (notificationTimeoutRef.current) {
          clearTimeout(notificationTimeoutRef.current);
        }
        notificationTimeoutRef.current = setTimeout(() => {
          setNotification({ visible: false, message: '', trigger: '' });
        }, 5000);
      }
    } else {
      lowEngagementStartRef.current = null;
      notificationShownRef.current = false;
    }
  }, [scoreData, signals, settings, audioUnlocked]);

  const playAudioCue = () => {
    if (!audioContextRef.current) return;

    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    const now = ctx.currentTime;
    const duration = AUDIO_CUE.duration / 1000;
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
  const scores = [
    { score: signals.gazeScore, trigger: 'gaze' as const },
    { score: signals.blinkScore, trigger: 'blink' as const },
    { score: signals.expressionScore, trigger: 'expression' as const },
    { score: signals.headPoseScore, trigger: 'headPose' as const },
  ];

  scores.sort((a, b) => a.score - b.score);
  const lowestSignal = scores[0];

  if (lowestSignal.score < 50) {
    return lowestSignal.trigger;
  }

  return 'general';
}
