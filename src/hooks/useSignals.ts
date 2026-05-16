import { useEffect, useRef, useState } from 'react';
import { getGazeDirection, gazeToEngagementScore } from '../utils/gazeDetection';
import { getHeadPose, headPoseToEngagementScore } from '../utils/headPose';
import { trackBlinkRate, blinkRateToEngagementScore, type BlinkRateData } from '../utils/blinkRate';
import {
  getExpressionScore,
  expressionToEngagementScore,
  updateExpressionBaseline,
  type ExpressionBaseline,
} from '../utils/expressionScore';

interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Signals {
  gazeScore: number;
  blinkScore: number;
  expressionScore: number;
  headPoseScore: number;
  gazeData: any;
  headPoseData: any;
  blinkData: BlinkRateData;
  expressionData: {
    negativityScore: number;
    baseline: ExpressionBaseline | null;
  };
}

export function useSignals(landmarks: Point3D[] | null) {
  const [signals, setSignals] = useState<Signals | null>(null);
  const blinkHistoryRef = useRef<BlinkRateData[]>([]);
  const expressionBaselineRef = useRef<ExpressionBaseline | null>(null);
  const headTiltStartTimeRef = useRef<number | null>(null);
  const lastHeadTiltedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!landmarks || landmarks.length < 476) {
      setSignals(null);
      return;
    }

    // Calculate gaze score
    const gazeData = getGazeDirection(landmarks);
    const gazeScore = gazeToEngagementScore(gazeData);

    // Calculate head pose score
    const headPoseData = getHeadPose(landmarks);

    // Track head tilt duration
    if (headPoseData.isTilted && !lastHeadTiltedRef.current) {
      headTiltStartTimeRef.current = Date.now();
    } else if (!headPoseData.isTilted && lastHeadTiltedRef.current) {
      headTiltStartTimeRef.current = null;
    }
    lastHeadTiltedRef.current = headPoseData.isTilted;

    const tiltDuration = headTiltStartTimeRef.current ? Date.now() - headTiltStartTimeRef.current : 0;
    const headPoseScore = headPoseToEngagementScore(headPoseData, tiltDuration);

    // Calculate blink rate score
    const blinkData = trackBlinkRate(landmarks, blinkHistoryRef.current);
    blinkHistoryRef.current = [blinkData];
    const blinkScore = blinkRateToEngagementScore(blinkData);

    // Calculate expression score
    const expressionResult = getExpressionScore(landmarks, expressionBaselineRef.current);
    expressionBaselineRef.current = expressionResult.baseline;

    // Slowly update baseline for lighting/angle adaptation
    if (expressionBaselineRef.current) {
      expressionBaselineRef.current = updateExpressionBaseline(
        landmarks,
        expressionBaselineRef.current,
        0.02 // gentle smoothing
      );
    }

    const expressionScore = expressionToEngagementScore(expressionResult.negativityScore);

    setSignals({
      gazeScore,
      blinkScore,
      expressionScore,
      headPoseScore,
      gazeData,
      headPoseData,
      blinkData,
      expressionData: {
        negativityScore: expressionResult.negativityScore,
        baseline: expressionBaselineRef.current,
      },
    });
  }, [landmarks]);

  return signals;
}
