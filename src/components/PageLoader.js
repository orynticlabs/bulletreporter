import React from 'react';

const PageLoader = ({ message = "लोड हो रहा है..." }) => {
  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="text-center">
        {/* Simple spinning loader */}
        <div className="inline-block w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mb-4"></div>
        
        {/* Loading message */}
        <p className="text-red-600 font-medium text-lg">{message}</p>
        
        {/* Simple dots animation */}
        <div className="flex justify-center mt-2 space-x-1">
          <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default PageLoader; 