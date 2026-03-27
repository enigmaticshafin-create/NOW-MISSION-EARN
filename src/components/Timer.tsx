import React, { useEffect, useState } from 'react';

export const Timer: React.FC = () => {
  const [startTime] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 10); // Update every 10ms for centiseconds
    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (ms: number) => {
    // Offset by 10ms to start from 00:00:00:01 as requested
    const adjustedMs = ms + 10;
    const centiseconds = Math.floor((adjustedMs / 10) % 100);
    const seconds = Math.floor((adjustedMs / 1000) % 60);
    const minutes = Math.floor((adjustedMs / (1000 * 60)) % 60);
    const hours = Math.floor((adjustedMs / (1000 * 60 * 60)) % 24);

    return {
      hours: String(hours).padStart(2, '0'),
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0'),
      centiseconds: String(centiseconds).padStart(2, '0'),
    };
  };

  const { hours, minutes, seconds, centiseconds } = formatTime(elapsed);

  return (
    <div className="flex items-center gap-1 bg-pink-500 text-white px-3 py-1 rounded-full font-bold text-xs shadow-lg font-mono">
      <span>{hours}</span>
      <span className="animate-blink">:</span>
      <span>{minutes}</span>
      <span className="animate-blink">:</span>
      <span>{seconds}</span>
      <span className="animate-blink">:</span>
      <span className="text-pink-200">{centiseconds}</span>
    </div>
  );
};
