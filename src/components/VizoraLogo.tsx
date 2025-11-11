import React from 'react';

const VizoraLogo = () => {
  return (
    <div className="flex items-center space-x-2">
      <div className="relative w-8 h-8">
        {/* Upper funnel layer */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-6 h-3 bg-gradient-to-b from-blue-500 to-purple-600 rounded-t-full"></div>
        {/* Lower funnel layer */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gradient-to-b from-blue-400 to-purple-500 rounded-b-full"></div>
        {/* Inner glow effect */}
        <div className="absolute inset-0 rounded-full shadow-[0_0_8px_rgba(139,92,246,0.5)]"></div>
      </div>
      <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
        Vizora
      </span>
    </div>
  );
};

export default VizoraLogo;