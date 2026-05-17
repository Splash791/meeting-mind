// Engagement thresholds (fine-tuned)
export const ENGAGEMENT_THRESHOLD = 45; // Notify at 45% instead of 50%
export const SUSTAINED_LOW_DURATION = 40000; // 40 seconds instead of 30 (less aggressive)
export const ROLLING_WINDOW_SIZE = 5000; // 5 seconds

// Detection signal thresholds (more forgiving)
export const GAZE_AWAY_THRESHOLD = 0.65; // 65% off-center (slightly more forgiving)
export const HEAD_TILT_THRESHOLD = 20; // 20 degrees instead of 15 (more natural movement allowed)
export const HEAD_TILT_PENALTY_THRESHOLD = 12000; // 12 seconds instead of 10
export const BLINK_RATE_LOW_THRESHOLD = 10; // 10 BPM instead of 12 (more forgiving)
export const BLINK_EAR_CLOSED = 0.18; // Slightly higher threshold for detecting blinks

// Signal weights in composite score
export const SIGNAL_WEIGHTS = {
  gaze: 0.35,
  blinkRate: 0.35,
  expression: 0.2,
  headPose: 0.1,
};

// HUD color thresholds
export const HUD_COLORS = {
  high: '#10b981', // green
  medium: '#f59e0b', // yellow
  low: '#ef4444', // red
};

// Engagement score thresholds for HUD colors
export const COLOR_THRESHOLD = {
  high: 70,
  medium: 40,
  low: 0,
};

// Notification messages by trigger type (warm & encouraging)
export const NOTIFICATION_MESSAGES = {
  gaze: "Eyes wandering? Bring your focus back to the screen! 👀",
  blink: "Your eyes need a break—try blinking more naturally 😊",
  expression: "Stay engaged! A little positivity goes a long way ✨",
  headPose: "Sit up straight and keep your energy up! 💪",
  general: "Let's bring back your focus—you've got this! 🎯",
};

// Audio cue parameters
export const AUDIO_CUE = {
  frequency: 500, // Hz
  duration: 200, // ms
  volume: 0.3, // 0-1
};

// Face mesh landmark indices
export const LANDMARKS = {
  noseTip: 1,
  noseBridge: 8,
  noseBridge2: 168,
  leftEye: {
    corners: [33, 160],
    upper: [29, 27],
    lower: [23, 26],
  },
  rightEye: {
    corners: [362, 385],
    upper: [354, 352],
    lower: [353, 349],
  },
  leftIris: 469,
  rightIris: 474,
  leftEar: 234,
  rightEar: 454,
  mouthLeft: 61,
  mouthRight: 291,
  eyebrowLeft: 55,
  eyebrowRight: 285,
};
