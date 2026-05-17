import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';
import { Settings, Volume2, Eye, EyeOff, Smile, Move, SlidersHorizontal, X } from 'lucide-react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { settings, updateSettings, unlockAudio } = useSettings();

  const handleTestAudio = () => {
    unlockAudio();
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 500;
      gain.gain.value = 0.1;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {
      console.error('Audio unlock failed', e);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="fixed top-0 right-0 h-full w-80 glass-panel border-y-0 border-r-0 rounded-none z-50 p-6 overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Settings className="w-5 h-5 text-neon-green" />
              Preferences
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            <section className="space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-widest text-white/50">Audio & Alerts</h3>
              
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center gap-3">
                  <Volume2 className={`w-5 h-5 ${settings.audioEnabled ? 'text-neon-yellow' : 'text-white/30'}`} />
                  <div>
                    <p className="text-sm font-medium">Audio Cues</p>
                    <p className="text-[10px] text-white/50">Play chime on low focus</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleTestAudio}
                    className="px-2 py-1 bg-white/10 rounded text-[10px] hover:bg-white/20 transition-colors cursor-pointer"
                  >
                    Test
                  </button>
                  <input
                    type="checkbox"
                    checked={settings.audioEnabled}
                    onChange={(e) => updateSettings({ audioEnabled: e.target.checked })}
                    className="w-4 h-4 accent-neon-yellow cursor-pointer"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-widest text-white/50">Tracking Metrics</h3>
              
              <ToggleRow 
                icon={<Eye className={settings.trackGaze ? 'text-neon-green' : 'text-white/30'} />}
                label="Gaze Tracking"
                checked={settings.trackGaze}
                onChange={(c) => updateSettings({ trackGaze: c })}
              />
              <ToggleRow 
                icon={<EyeOff className={settings.trackBlinks ? 'text-neon-green' : 'text-white/30'} />}
                label="Blink Rate"
                checked={settings.trackBlinks}
                onChange={(c) => updateSettings({ trackBlinks: c })}
              />
              <ToggleRow 
                icon={<Smile className={settings.trackExpressions ? 'text-neon-green' : 'text-white/30'} />}
                label="Expressions"
                checked={settings.trackExpressions}
                onChange={(c) => updateSettings({ trackExpressions: c })}
              />
              <ToggleRow 
                icon={<Move className={settings.trackHeadPose ? 'text-neon-green' : 'text-white/30'} />}
                label="Head Pose"
                checked={settings.trackHeadPose}
                onChange={(c) => updateSettings({ trackHeadPose: c })}
              />
            </section>

            <section className="space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-widest text-white/50">Thresholds</h3>
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center gap-3 mb-3">
                  <SlidersHorizontal className="w-5 h-5 text-neon-red" />
                  <p className="text-sm font-medium">Sensitivity</p>
                  <span className="ml-auto text-neon-red font-mono text-sm">{settings.engagementThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="80"
                  value={settings.engagementThreshold}
                  onChange={(e) => updateSettings({ engagementThreshold: parseInt(e.target.value) })}
                  className="w-full accent-neon-red cursor-pointer"
                />
                <p className="text-[10px] text-white/50 mt-2 text-center">
                  Alert when score drops below this value
                </p>
              </div>
            </section>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ToggleRow({ icon, label, checked, onChange }: { icon: React.ReactNode, label: string, checked: boolean, onChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
      <div className="flex items-center gap-3">
        {icon}
        <p className="text-sm font-medium">{label}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-neon-green cursor-pointer"
      />
    </div>
  );
}
