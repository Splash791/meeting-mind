import { useEffect, useRef, useState } from 'react';

interface Point3D {
  x: number;
  y: number;
  z: number;
}

export function useFaceMesh() {
  console.log('[useFaceMesh] Hook called');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<any>(null);
  const faceMeshRef = useRef<any>(null);

  const [landmarks, setLandmarks] = useState<Point3D[] | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Delay initialization to let DOM elements mount
    const initTimer = setTimeout(() => {
      if (!isMounted) return;

      console.log('Effect: Checking refs', {
        video: !!videoRef.current,
        canvas: !!canvasRef.current,
      });

      if (!videoRef.current || !canvasRef.current) {
        console.log('Refs still not ready');
        return;
      }

      console.log('Refs ready! Starting initialization...');
      initMediaPipe();
    }, 100); // Wait 100ms for scripts to load

    const initMediaPipe = async () => {
      try {
        console.log('Checking for MediaPipe globals...');

        // Wait for MediaPipe to be available globally
        let attempts = 0;
        while (!((window as any).FaceMesh || (window as any).Camera) && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }

        const FaceMesh = (window as any).FaceMesh;
        const Camera = (window as any).Camera;

        console.log('FaceMesh available:', !!FaceMesh);
        console.log('Camera available:', !!Camera);

        if (!FaceMesh || !Camera) {
          throw new Error('MediaPipe libraries not loaded. FaceMesh=' + !!FaceMesh + ', Camera=' + !!Camera);
        }

        if (!isMounted) return;

        console.log('Creating FaceMesh instance...');
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

          if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            const faceLandmarks = results.multiFaceLandmarks[0];
            setLandmarks(faceLandmarks);
          } else {
            setLandmarks(null);
          }

          const canvasCtx = canvasElement.getContext('2d');
          if (!canvasCtx) return;

          canvasCtx.save();
          canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

          if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            drawFaceLandmarks(canvasCtx, results.multiFaceLandmarks[0], canvasElement.width, canvasElement.height);
          }

          canvasCtx.restore();
        });

        console.log('Creating Camera instance...');
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

        console.log('Starting camera...');
        await camera.start();
        console.log('✅ Camera ready!');
        if (isMounted) {
          setIsReady(true);
        }
      } catch (err: any) {
        if (isMounted) {
          const errorMsg = err.message || 'Failed to initialize';
          console.error('Init error:', err);
          setError(errorMsg);
        }
      }
    };

    return () => {
      isMounted = false;
      clearTimeout(initTimer);
      if (cameraRef.current) {
        try {
          cameraRef.current.stop();
        } catch (err) {
          console.error('Error stopping camera:', err);
        }
      }
    };
  }, []);

  const drawFaceLandmarks = (
    ctx: CanvasRenderingContext2D,
    landmarks: any[],
    width: number,
    height: number
  ) => {
    ctx.fillStyle = '#00FF00';
    landmarks.forEach((point, index) => {
      const x = point.x * width;
      const y = point.y * height;
      ctx.fillRect(x - 1, y - 1, 2, 2);

      if (index === 1 || index === 33 || index === 362) {
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(x - 2, y - 2, 4, 4);
        ctx.fillStyle = '#00FF00';
      }
    });

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
