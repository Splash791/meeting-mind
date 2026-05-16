import { LANDMARKS, GAZE_AWAY_THRESHOLD } from '../constants';

interface Point3D {
  x: number;
  y: number;
  z: number;
}

export function getGazeDirection(landmarks: Point3D[]): {
  isLooking: boolean;
  direction: 'centered' | 'left' | 'right' | 'down';
  confidence: number;
} {
  if (!landmarks || landmarks.length < 476) {
    return { isLooking: false, direction: 'centered', confidence: 0 };
  }

  const leftEye = {
    corner1: landmarks[33],
    corner2: landmarks[160],
    iris: landmarks[LANDMARKS.leftIris],
  };

  const rightEye = {
    corner1: landmarks[362],
    corner2: landmarks[385],
    iris: landmarks[LANDMARKS.rightIris],
  };

  // Calculate gaze direction for left eye
  const leftGaze = calculateEyeGaze(leftEye.corner1, leftEye.corner2, leftEye.iris);

  // Calculate gaze direction for right eye
  const rightGaze = calculateEyeGaze(rightEye.corner1, rightEye.corner2, rightEye.iris);

  // Average the gaze directions
  const avgGazeX = (leftGaze.x + rightGaze.x) / 2;
  const avgGazeY = (leftGaze.y + rightGaze.y) / 2;

  // Determine direction based on iris position
  let direction: 'centered' | 'left' | 'right' | 'down' = 'centered';
  let isLooking = true;

  // Check horizontal deviation
  if (avgGazeX < -GAZE_AWAY_THRESHOLD) {
    direction = 'left';
    isLooking = false;
  } else if (avgGazeX > GAZE_AWAY_THRESHOLD) {
    direction = 'right';
    isLooking = false;
  }

  // Check vertical deviation (down = looking away from screen)
  if (avgGazeY > GAZE_AWAY_THRESHOLD) {
    direction = 'down';
    isLooking = false;
  }

  // Calculate confidence (how well-defined the iris is)
  const confidence = Math.max(0, 1 - (Math.abs(avgGazeX) + Math.abs(avgGazeY)) / 2);

  return { isLooking, direction, confidence };
}

function calculateEyeGaze(
  corner1: Point3D,
  corner2: Point3D,
  iris: Point3D
): { x: number; y: number } {
  // Calculate eye width
  const eyeWidth = Math.abs(corner2.x - corner1.x);
  const eyeHeight = Math.abs(corner2.y - corner1.y);

  if (eyeWidth === 0 || eyeHeight === 0) {
    return { x: 0, y: 0 };
  }

  // Calculate the center of the eye
  const eyeCenterX = (corner1.x + corner2.x) / 2;
  const eyeCenterY = (corner1.y + corner2.y) / 2;

  // Calculate iris position relative to eye center, normalized to -1 to 1
  const normalizedX = (iris.x - eyeCenterX) / (eyeWidth / 2);
  const normalizedY = (iris.y - eyeCenterY) / (eyeHeight / 2);

  // Clamp to reasonable range
  return {
    x: Math.max(-1, Math.min(1, normalizedX)),
    y: Math.max(-1, Math.min(1, normalizedY)),
  };
}

export function gazeToEngagementScore(gazeData: {
  isLooking: boolean;
  direction: string;
  confidence: number;
}): number {
  // If looking at screen, high engagement
  if (gazeData.isLooking) {
    return 100 * gazeData.confidence;
  }

  // If looking away, low engagement
  // Penalize more if confidence is high (clearly looking away)
  return Math.max(0, 30 - gazeData.confidence * 30);
}
