'use client';

import { useEffect, useState } from 'react';

interface ScoreRingProps {
  score: number; // 0 to 100
  label: string;
  size?: number;
  strokeWidth?: number;
  colorClass?: string;
}

export default function ScoreRing({ 
  score, 
  label, 
  size = 120, 
  strokeWidth = 8,
  colorClass = 'text-accent-primary' 
}: ScoreRingProps) {
  const [progress, setProgress] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setProgress(score), 300);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background Track */}
        <svg className="absolute top-0 left-0 -rotate-90 w-full h-full transform transition-all duration-1000 ease-out">
          <circle
            className="text-white/10"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          {/* Animated Fill Track */}
          <circle
            className={`transition-all duration-1000 ease-out ${colorClass}`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>
        {/* Center Number */}
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-3xl font-extrabold font-outfit text-text-primary">
            {Math.round(progress)}
          </span>
          <span className="text-xs font-semibold text-text-secondary">%</span>
        </div>
      </div>
      <span className="text-sm font-semibold text-text-muted uppercase tracking-widest">{label}</span>
    </div>
  );
}
