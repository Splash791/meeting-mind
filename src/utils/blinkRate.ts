import { BLINK_EAR_CLOSED, BLINK_RATE_LOW_THRESHOLD } from '../constants';

interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface BlinkRateData {
  earValues: number[];
  blinkCount: number;
  blinkRate: number; // blinks per minute
  isBelowThreshold: boolean;
}

const BLINK_HISTORY_SIZE = 150; // ~5s at 30fps

export function calculateEyeAspectRatio(
  eyeLandmarks: {
    upper1: Point3D;
    upper2: Point3D;
    lower1: Point3D;
    lower2: Point3D;
    corner1: Point3D;
    corner2: Point3D;
  }
): number {
  // Eye Aspect Ratio (EAR) formula:
  // EAR = (||p2-p6|| + ||p3-p5||) / (2*||p1-p4||)

  const dist = (p1: Point3D, p2: Point3D) => {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const numerator =
    dist(eyeLandmarks.upper1, eyeLandmarks.lower1) +
    dist(eyeLandmarks.upper2, eyeLandmarks.lower2);

  const denominator = 2 * dist(eyeLandmarks.corner1, eyeLandmarks.corner2);

  if (denominator === 0) return 0.5;

  return numerator / denominator;
}

export function trackBlinkRate(landmarks: Point3D[], history: BlinkRateData[]): BlinkRateData {
  if (!landmarks || landmarks.length < 476) {
    return {
      earValues: [],
      blinkCount: 0,
      blinkRate: 0,
      isBelowThreshold: false,
    };
  }

  // Extract eye landmarks
  const leftEye = {
    upper1: landmarks[27],
    upper2: landmarks[29],
    lower1: landmarks[23],
    lower2: landmarks[26],
    corner1: landmarks[33],
    corner2: landmarks[160],
  };

  const rightEye = {
    upper1: landmarks[352],
    upper2: landmarks[354],
    lower1: landmarks[349],
    lower2: landmarks[353],
    corner1: landmarks[362],
    corner2: landmarks[385],
  };

  // Calculate EAR for both eyes
  const leftEAR = calculateEyeAspectRatio(leftEye);
  const rightEAR = calculateEyeAspectRatio(rightEye);
  const avgEAR = (leftEAR + rightEAR) / 2;

  // Update history
  const newHistory = history.length > 0 ? [...history] : [];
  const lastData = newHistory[newHistory.length - 1];

  // Detect blink (EAR drops below threshold then rises again)
  let blinkCount = lastData?.blinkCount || 0;
  const wasOpen = lastData && lastData.earValues.length > 0
    ? lastData.earValues[lastData.earValues.length - 1] > BLINK_EAR_CLOSED
    : true;
  const isClosed = avgEAR <= BLINK_EAR_CLOSED;

  if (wasOpen && isClosed) {
    blinkCount++;
  }

  // Keep EAR history
  const earValues = lastData ? [...lastData.earValues, avgEAR] : [avgEAR];
  if (earValues.length > BLINK_HISTORY_SIZE) {
    earValues.shift();
  }

  // Calculate blink rate (blinks per minute)
  // At 30fps, 150 frames = 5 seconds
  // blinks in 5s * 12 = blinks per minute
  const timeWindowMs = (earValues.length / 30) * 1000; // convert frames to ms
  const blinkRate = earValues.length > 0
    ? (blinkCount / (timeWindowMs / 60000))
    : 0;

  const isBelowThreshold = blinkRate < BLINK_RATE_LOW_THRESHOLD && blinkRate > 0;

  return {
    earValues,
    blinkCount,
    blinkRate: Math.round(blinkRate * 10) / 10, // round to 1 decimal
    isBelowThreshold,
  };
}

export function blinkRateToEngagementScore(blinkData: BlinkRateData): number {
  if (blinkData.blinkRate === 0) {
    return 50; // Unknown state
  }

  // Normal blink rate is 15-20 blinks per minute
  // Below 12 BPM = low engagement
  // Above 30 BPM = stress/anxiety (but less critical than low blink)

  if (blinkData.blinkRate < 5) {
    return 20; // Very low, clearly disengaged/staring
  }

  if (blinkData.blinkRate < BLINK_RATE_LOW_THRESHOLD) {
    return 40; // Low blink rate = low engagement
  }

  if (blinkData.blinkRate > 40) {
    return 70; // High blink rate = some stress but still engaged
  }

  // Normal range (12-40 BPM)
  return 100;
}
