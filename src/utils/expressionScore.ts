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

export type PrimaryExpression = 'Neutral' | 'Smiling' | 'Frowning' | 'Confused' | 'Yawning';

export function getExpressionScore(
  landmarks: Point3D[],
  baseline: ExpressionBaseline | null = null
): {
  negativityScore: number;
  primaryExpression: PrimaryExpression;
  baseline: ExpressionBaseline;
} {
  if (!landmarks || landmarks.length < 476) {
    return {
      negativityScore: 50,
      primaryExpression: 'Neutral',
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
  
  const mouthTop = landmarks[13];
  const mouthBottom = landmarks[14];

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

  // Determine Primary Expression
  let primaryExpression: PrimaryExpression = 'Neutral';
  const mouthHeight = mouthBottom.y - mouthTop.y;
  const mouthWidth = mouthRight.x - mouthLeft.x;

  if (mouthHeight / mouthWidth > 0.45) {
    primaryExpression = 'Yawning';
  } else if (mouthDropAvg < -0.015) {
    primaryExpression = 'Smiling';
  } else if (eyebrowRaiseAvg < -0.01) {
    primaryExpression = 'Confused';
  } else if (mouthDropAvg > 0.02) {
    primaryExpression = 'Frowning';
  }

  // Calculate negativity score (0-100, 100 = very negative)
  let negativityScore = 50;

  if (primaryExpression === 'Yawning') {
    negativityScore = 80;
  } else if (primaryExpression === 'Smiling') {
    negativityScore = 0; // Extremely positive
  } else if (primaryExpression === 'Confused') {
    negativityScore = 70;
  } else if (primaryExpression === 'Frowning') {
    negativityScore = 90;
  } else {
    // Neutral variations
    const mouthNegativity = Math.max(0, Math.min(100, mouthDropAvg * 200));
    const browNegativity = Math.max(0, Math.min(100, -eyebrowRaiseAvg * 200));
    negativityScore = (mouthNegativity * 0.6 + browNegativity * 0.4);
  }

  return {
    negativityScore: Math.round(negativityScore),
    primaryExpression,
    baseline,
  };
}

export function expressionToEngagementScore(negativityScore: number, primaryExpression: PrimaryExpression): number {
  // Smiling = bonus
  if (primaryExpression === 'Smiling') return 100;
  // Yawning = strong indicator of tiredness
  if (primaryExpression === 'Yawning') return 15;
  // Neutral/slight variations are fine
  if (negativityScore < 30) return 100; // Neutral or slight variations OK
  if (negativityScore < 45) return 95; // Mostly neutral
  if (negativityScore < 60) return 85; // Slight frown, minor penalty
  if (negativityScore < 75) return 70; // Moderate frown
  if (negativityScore < 90) return 50; // Heavy frown
  return 20; // Extreme negativity
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

  return {
    mouthLeftY: currentBaseline.mouthLeftY * (1 - smoothingFactor) + mouthLeft.y * smoothingFactor,
    mouthRightY: currentBaseline.mouthRightY * (1 - smoothingFactor) + mouthRight.y * smoothingFactor,
    eyebrowLeftY: currentBaseline.eyebrowLeftY * (1 - smoothingFactor) + eyebrowLeft.y * smoothingFactor,
    eyebrowRightY: currentBaseline.eyebrowRightY * (1 - smoothingFactor) + eyebrowRight.y * smoothingFactor,
  };
}
