import React, { createContext, useContext, useState, useEffect } from 'react';

export type Position = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-middle';

interface Settings {
  audioEnabled: boolean;
  trackGaze: boolean;
  trackBlinks: boolean;
  trackExpressions: boolean;
  trackHeadPose: boolean;
  engagementThreshold: number;
  hudPosition: Position;
  webcamPosition: Position;
}

const defaultSettings: Settings = {
  audioEnabled: true,
  trackGaze: true,
  trackBlinks: true,
  trackExpressions: true,
  trackHeadPose: true,
  engagementThreshold: 50,
  hudPosition: 'top-right',
  webcamPosition: 'bottom-right',
};

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  unlockAudio: () => void;
  audioUnlocked: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('meetingmind_settings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  const [audioUnlocked, setAudioUnlocked] = useState(false);

  useEffect(() => {
    localStorage.setItem('meetingmind_settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const unlockAudio = () => {
    setAudioUnlocked(true);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, unlockAudio, audioUnlocked }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
