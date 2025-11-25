import React from 'react';

const VizoraLogo = ({ className = "" }: { className?: string }) => {
  return (
    <div className="flex items-center gap-3">
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-8 h-8 ${className}`}
        style={{ display: "inline-block", verticalAlign: "middle" }}
      >
        <defs>
          <linearGradient id="vizoraGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Upper arrow - bold downward chevron */}
        <path
          d="M 15 20 L 50 60 L 85 20 L 78 15 L 50 48 L 22 15 Z"
          fill="url(#vizoraGradient)"
          filter="url(#glow)"
          opacity="0.95"
        />

        {/* Lower arrow - slightly smaller, creates stacked effect */}
        <path
          d="M 22 50 L 50 85 L 78 50 L 72 46 L 50 73 L 28 46 Z"
          fill="url(#vizoraGradient)"
          filter="url(#glow)"
          opacity="0.85"
        />

        {/* Energy streaks for dynamic motion */}
        <path
          d="M 10 25 L 14 30"
          stroke="#8b5cf6"
          strokeWidth="3"
          opacity="0.6"
          strokeLinecap="round"
        />
        <path
          d="M 86 25 L 90 30"
          stroke="#06b6d4"
          strokeWidth="3"
          opacity="0.6"
          strokeLinecap="round"
        />
        <path
          d="M 17 55 L 21 60"
          stroke="#8b5cf6"
          strokeWidth="3"
          opacity="0.5"
          strokeLinecap="round"
        />
        <path
          d="M 79 55 L 83 60"
          stroke="#06b6d4"
          strokeWidth="3"
          opacity="0.5"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400">
        Vizora
      </span>
    </div>
  );
};

export default VizoraLogo;
