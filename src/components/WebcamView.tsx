import React from 'react';

interface WebcamViewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isReady: boolean;
  error: string | null;
}

export function WebcamView({ videoRef, canvasRef, isReady, error }: WebcamViewProps) {
  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-2">
      {/* Webcam feed container */}
      <div className="relative w-72 h-56 rounded-lg shadow-lg overflow-hidden bg-black">
        {!isReady ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <p className="text-white text-sm">Initializing camera...</p>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900">
            <div className="text-center">
              <p className="text-white text-sm font-medium mb-2">Camera Error</p>
              <p className="text-red-200 text-xs">{error}</p>
              <p className="text-red-300 text-xs mt-2">Check camera permissions</p>
            </div>
          </div>
        ) : null}

        {/* Always render video and canvas for refs (hidden by CSS when not ready) */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={`absolute inset-0 w-full h-full object-cover mirror ${!isReady || error ? 'hidden' : ''}`}
          style={{ transform: 'scaleX(-1)' }}
        />

        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full ${!isReady || error ? 'hidden' : ''}`}
          width={640}
          height={480}
        />

        {/* Status indicator */}
        {isReady && !error && (
          <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-green-500 animate-pulse" />
        )}
      </div>

      {/* Info text */}
      {isReady && !error && (
        <p className="text-xs text-gray-600 text-right">Camera active</p>
      )}
    </div>
  );
}
