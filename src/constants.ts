// Engagement thresholds
export const ENGAGEMENT_THRESHOLD = 50;
export const SUSTAINED_LOW_DURATION = 30000; // 30 seconds in milliseconds
export const ROLLING_WINDOW_SIZE = 5000; // 5 seconds

// Detection signal thresholds
export const GAZE_AWAY_THRESHOLD = 0.6; // 60% off-center
export const HEAD_TILT_THRESHOLD = 15; // degrees
export const HEAD_TILT_PENALTY_THRESHOLD = 10000; // 10 seconds before head tilt counts
export const BLINK_RATE_LOW_THRESHOLD = 12; // blinks per minute (low engagement indicator)
export const BLINK_EAR_CLOSED = 0.15; // Eye Aspect Ratio threshold for closed eye

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

// Notification messages by trigger type
export const NOTIFICATION_MESSAGES = {
  gaze: "Looks like something caught your eye — refocus when you can!",
  blink: "Blink rate's dropping — you doing okay?",
  expression: "A quick smile can go a long way in this meeting!",
  headPose: "Looks like you might be drifting — bring it back!",
  general: "Looks like you might be losing focus — bring it back!",
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
