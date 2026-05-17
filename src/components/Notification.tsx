import { useEffect, useState } from 'react';
import type { Notification as NotificationData } from '../hooks/useNotifications';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Eye, EyeOff, Meh } from 'lucide-react';

interface NotificationProps {
  notification: NotificationData;
}

export function Notification({ notification }: NotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(notification.visible);
  }, [notification.visible]);

  const getTriggerIcon = (trigger: string) => {
    switch (trigger) {
      case 'gaze': return <EyeOff className="w-6 h-6 text-neon-yellow" />;
      case 'blink': return <Eye className="w-6 h-6 text-neon-yellow" />;
      case 'expression': return <Meh className="w-6 h-6 text-neon-yellow" />;
      case 'headPose': return <AlertTriangle className="w-6 h-6 text-neon-yellow" />;
      default: return <AlertTriangle className="w-6 h-6 text-neon-yellow" />;
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-12 left-1/2 transform -translate-x-1/2 w-full max-w-md z-50 pointer-events-none"
        >
          <div className="glass-panel p-5 rounded-2xl border-l-[6px] border-l-neon-yellow shadow-[0_0_50px_rgba(255,214,0,0.15)] flex items-start gap-4">
            <div className="p-3 bg-neon-yellow/10 rounded-xl shrink-0">
              {getTriggerIcon(notification.trigger)}
            </div>
            <div className="flex-1 pt-1">
              <p className="text-white/90 font-medium text-[15px] leading-snug">
                {notification.message}
              </p>
              <div className="mt-4 h-1 bg-surface-border rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 5, ease: "linear" }}
                  className="h-full bg-neon-yellow shadow-[0_0_10px_rgba(255,214,0,0.5)]"
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
