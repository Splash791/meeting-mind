import { LANDMARKS, HEAD_TILT_THRESHOLD } from '../constants';

interface Point3D {
  x: number;
  y: number;
  z: number;
}

export function getHeadPose(landmarks: Point3D[]): {
  yawAngle: number;
  pitchAngle: number;
  rollAngle: number;
  isTilted: boolean;
} {
  if (!landmarks || landmarks.length < 476) {
    return { yawAngle: 0, pitchAngle: 0, rollAngle: 0, isTilted: false };
  }

  const nose = landmarks[LANDMARKS.noseTip];
  const noseBridge = landmarks[LANDMARKS.noseBridge];
  const leftEar = landmarks[LANDMARKS.leftEar];
  const rightEar = landmarks[LANDMARKS.rightEar];
  const mouthLeft = landmarks[LANDMARKS.mouthLeft];
  const mouthRight = landmarks[LANDMARKS.mouthRight];

  // Calculate yaw (left-right turn)
  const yawAngle = calculateYaw(nose, leftEar, rightEar);

  // Calculate pitch (up-down tilt)
  const pitchAngle = calculatePitch(noseBridge, nose, mouthLeft, mouthRight);

  // Calculate roll (head tilt)
  const rollAngle = calculateRoll(leftEar, rightEar);

  // Determine if head is significantly tilted
  const isTilted =
    Math.abs(yawAngle) > HEAD_TILT_THRESHOLD ||
    Math.abs(pitchAngle) > HEAD_TILT_THRESHOLD ||
    Math.abs(rollAngle) > HEAD_TILT_THRESHOLD;

  return { yawAngle, pitchAngle, rollAngle, isTilted };
}

function calculateYaw(
  nose: Point3D,
  leftEar: Point3D,
  rightEar: Point3D
): number {
  // Calculate the horizontal distance from nose to ear line
  const earCenterX = (leftEar.x + rightEar.x) / 2;
  const earCenterZ = (leftEar.z + rightEar.z) / 2;

  const dx = nose.x - earCenterX;
  const dz = nose.z - earCenterZ;

  // Calculate angle in degrees
  const angle = Math.atan2(dx, dz) * (180 / Math.PI);

  return Math.max(-90, Math.min(90, angle));
}

function calculatePitch(
  noseBridge: Point3D,
  noseTip: Point3D,
  mouthLeft: Point3D,
  mouthRight: Point3D
): number {
  // Calculate vertical tilt using nose bridge to nose tip
  const dy = noseTip.y - noseBridge.y;
  const dz = noseTip.z - noseBridge.z;

  const noseAngle = Math.atan2(dy, dz) * (180 / Math.PI);

  // Also consider mouth position relative to nose
  const mouthCenterY = (mouthLeft.y + mouthRight.y) / 2;
  const mouthTilt = mouthCenterY - noseTip.y;

  // Combine both measurements for more robust pitch
  const angle = (noseAngle + mouthTilt * 5) / 2;

  return Math.max(-90, Math.min(90, angle));
}

function calculateRoll(leftEar: Point3D, rightEar: Point3D): number {
  // Calculate head roll (tilt) using ear positions
  const dy = rightEar.y - leftEar.y;
  const dx = rightEar.x - leftEar.x;

  // Calculate angle in degrees
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // Normalize to -45 to 45 degrees
  let normalized = angle;
  while (normalized > 45) normalized -= 90;
  while (normalized < -45) normalized += 90;

  return normalized;
}

export function headPoseToEngagementScore(
  headPose: {
    yawAngle: number;
    pitchAngle: number;
    rollAngle: number;
    isTilted: boolean;
  },
  tiltDuration: number
): number {
  // Head tilt alone isn't disengagement, but sustained tilt (>10s) counts
  if (!headPose.isTilted) {
    return 100;
  }

  // Only penalize if tilt has been sustained for 10 seconds
  if (tiltDuration < 10000) {
    return 100;
  }

  // Calculate penalty based on tilt angle severity
  const maxAngle = Math.max(
    Math.abs(headPose.yawAngle),
    Math.abs(headPose.pitchAngle),
    Math.abs(headPose.rollAngle)
  );

  // Linear penalty: 15° = no penalty, 60° = 50% penalty
  const anglePenalty = Math.max(0, (maxAngle - HEAD_TILT_THRESHOLD) / (90 - HEAD_TILT_THRESHOLD)) * 50;

  // Duration bonus: longer tilt = worse engagement
  const durationPenalty = Math.min(50, (tiltDuration / 60000) * 50); // 60s = max penalty

  return Math.max(0, 100 - anglePenalty - durationPenalty);
}
