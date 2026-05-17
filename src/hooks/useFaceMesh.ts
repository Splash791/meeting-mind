import { useEffect, useRef, useState } from 'react';

interface Point3D {
  x: number;
  y: number;
  z: number;
}

export function useFaceMesh() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<any>(null);
  const faceMeshRef = useRef<any>(null);

  const [landmarks, setLandmarks] = useState<Point3D[] | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    let isMounted = true;

    const initMediaPipe = async () => {
      try {
        // Dynamically import MediaPipe modules
        const faceMeshModule = await import('@mediapipe/face_mesh');
        const cameraModule = await import('@mediapipe/camera_utils');

        if (!isMounted) return;

        const FaceMesh = faceMeshModule.FaceMesh;
        const Camera = cameraModule.Camera;

        const faceMesh = new FaceMesh({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
          },
        });

        faceMeshRef.current = faceMesh;

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        faceMesh.onResults((results: any) => {
          if (!isMounted) return;

          const canvasElement = canvasRef.current;
          if (!canvasElement) return;

          // Convert normalized coordinates to canvas coordinates
          if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            const faceLandmarks = results.multiFaceLandmarks[0];
            setLandmarks(faceLandmarks);
          } else {
            setLandmarks(null);
          }

          // Draw on canvas for debugging
          const canvasCtx = canvasElement.getContext('2d');
          if (!canvasCtx) return;

          canvasCtx.save();
          canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

          // Draw landmarks if available
          if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            drawFaceLandmarks(canvasCtx, results.multiFaceLandmarks[0], canvasElement.width, canvasElement.height);
          }

          canvasCtx.restore();
        });

        const camera = new Camera(videoRef.current, {
          onFrame: async () => {
            try {
              await faceMesh.send({ image: videoRef.current! });
            } catch (err) {
              console.error('FaceMesh error:', err);
            }
          },
          width: 640,
          height: 480,
        });

        cameraRef.current = camera;

        // Start camera with proper error handling
        try {
          await camera.start();
          if (isMounted) {
            setIsReady(true);
          }
        } catch (err: any) {
          if (isMounted) {
            const errorMsg = err.message || 'Failed to access camera';
            setError(errorMsg);
            console.error('Camera error:', err);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('MediaPipe initialization error:', err);
          setError('Failed to initialize MediaPipe');
        }
      }
    };

    initMediaPipe();

    return () => {
      isMounted = false;
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
    };
  }, []);

  const drawFaceLandmarks = (
    ctx: CanvasRenderingContext2D,
    landmarks: any[],
    width: number,
    height: number
  ) => {
    // Draw landmarks as small circles
    ctx.fillStyle = '#00FF00';
    landmarks.forEach((point, index) => {
      const x = point.x * width;
      const y = point.y * height;
      ctx.fillRect(x - 1, y - 1, 2, 2);

      // Highlight key landmarks
      if (index === 1 || index === 33 || index === 362) {
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(x - 2, y - 2, 4, 4);
        ctx.fillStyle = '#00FF00';
      }
    });

    // Draw face contour
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 1;
    const faceContour = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    ctx.beginPath();
    faceContour.forEach((index, i) => {
      const point = landmarks[index];
      const x = point.x * width;
      const y = point.y * height;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
  };

  return {
    videoRef,
    canvasRef,
    landmarks,
    isReady,
    error,
  };
}
