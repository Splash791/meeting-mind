import { LANDMARKS } from '../constants';

interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface ExpressionBaseline {
  mouthLeftY: number;
  mouthRightY: number;
  eyebrowLeftY: number;
  eyebrowRightY: number;
}

export function getExpressionScore(
  landmarks: Point3D[],
  baseline: ExpressionBaseline | null = null
): {
  negativityScore: number;
  baseline: ExpressionBaseline;
} {
  if (!landmarks || landmarks.length < 476) {
    return {
      negativityScore: 50,
      baseline: baseline || {
        mouthLeftY: 0,
        mouthRightY: 0,
        eyebrowLeftY: 0,
        eyebrowRightY: 0,
      },
    };
  }

  // Extract relevant landmarks
  const mouthLeft = landmarks[LANDMARKS.mouthLeft];
  const mouthRight = landmarks[LANDMARKS.mouthRight];
  const eyebrowLeft = landmarks[LANDMARKS.eyebrowLeft];
  const eyebrowRight = landmarks[LANDMARKS.eyebrowRight];

  // Initialize baseline on first frame
  if (!baseline) {
    baseline = {
      mouthLeftY: mouthLeft.y,
      mouthRightY: mouthRight.y,
      eyebrowLeftY: eyebrowLeft.y,
      eyebrowRightY: eyebrowRight.y,
    };
  }

  // Calculate deviations from baseline
  // Negative Y change = mouth corners drooping (sad)
  // Positive Y change = eyebrows raising up (positive expression)
  const mouthLeftDrop = baseline.mouthLeftY - mouthLeft.y;
  const mouthRightDrop = baseline.mouthRightY - mouthRight.y;
  const mouthDropAvg = (mouthLeftDrop + mouthRightDrop) / 2;

  // Eyebrows: positive = raised (good), negative = furrowed (bad)
  const eyebrowLeftRaise = baseline.eyebrowLeftY - eyebrowLeft.y;
  const eyebrowRightRaise = baseline.eyebrowRightY - eyebrowRight.y;
  const eyebrowRaiseAvg = (eyebrowLeftRaise + eyebrowRightRaise) / 2;

  // Calculate negativity score (0-100, 100 = very negative)
  // Drooping mouth = high negativity
  // Furrowed brows = high negativity
  // Raised brows = low negativity
  const mouthNegativity = Math.max(0, Math.min(100, mouthDropAvg * 200)); // scale to 0-100
  const browNegativity = Math.max(0, Math.min(100, -eyebrowRaiseAvg * 200)); // inverted (raising = good)

  // Combine both signals
  const negativityScore = (mouthNegativity * 0.6 + browNegativity * 0.4);

  return {
    negativityScore: Math.round(negativityScore),
    baseline,
  };
}

export function expressionToEngagementScore(negativityScore: number): number {
  // High negativity = low engagement
  // 0 = happy/neutral (100% engagement)
  // 100 = very sad/furrowed (0% engagement)

  if (negativityScore < 20) {
    return 100; // Positive expression = high engagement
  }

  if (negativityScore < 40) {
    return 85; // Slightly negative
  }

  if (negativityScore < 60) {
    return 60; // Moderately negative
  }

  if (negativityScore < 80) {
    return 30; // Very negative
  }

  return 10; // Extremely negative
}

export function updateExpressionBaseline(
  landmarks: Point3D[],
  currentBaseline: ExpressionBaseline,
  smoothingFactor: number = 0.1
): ExpressionBaseline {
  if (!landmarks || landmarks.length < 476) {
    return currentBaseline;
  }

  const mouthLeft = landmarks[LANDMARKS.mouthLeft];
  const mouthRight = landmarks[LANDMARKS.mouthRight];
  const eyebrowLeft = landmarks[LANDMARKS.eyebrowLeft];
  const eyebrowRight = landmarks[LANDMARKS.eyebrowRight];

  // Apply exponential moving average to baseline
  // This allows the baseline to slowly adapt to different lighting/angles
  return {
    mouthLeftY: currentBaseline.mouthLeftY * (1 - smoothingFactor) + mouthLeft.y * smoothingFactor,
    mouthRightY: currentBaseline.mouthRightY * (1 - smoothingFactor) + mouthRight.y * smoothingFactor,
    eyebrowLeftY: currentBaseline.eyebrowLeftY * (1 - smoothingFactor) + eyebrowLeft.y * smoothingFactor,
    eyebrowRightY: currentBaseline.eyebrowRightY * (1 - smoothingFactor) + eyebrowRight.y * smoothingFactor,
  };
}
