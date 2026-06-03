import React from 'react';

const LoadingSpinner = ({ size = "md", message = "लोड हो रहा है...", className = "", variant = "spinner" }) => {
  const sizeClasses = {
    sm: "w-6 h-6 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
    xl: "w-16 h-16 border-4"
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl"
  };

  // Skeleton loading component
  const SkeletonLoader = () => (
    <div className="space-y-4">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="animate-pulse">
            <div className="h-48 bg-gray-200 rounded-lg mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    </div>
  );

  // Progress bar loading component
  const ProgressLoader = () => (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-gray-200 rounded-full h-2 mb-4">
        <div className="bg-red-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
      </div>
      <p className={`text-red-600 font-medium ${textSizes[size]} text-center`}>
        {message}
      </p>
    </div>
  );

  // Dots loading component
  const DotsLoader = () => (
    <div className="flex flex-col items-center justify-center">
      <div className="flex space-x-1">
        {[0, 1, 2].map((dot) => (
          <div
            key={dot}
            className={`bg-red-600 rounded-full animate-bounce`}
            style={{
              width: size === 'sm' ? '8px' : size === 'md' ? '10px' : size === 'lg' ? '12px' : '14px',
              height: size === 'sm' ? '8px' : size === 'md' ? '10px' : size === 'lg' ? '12px' : '14px',
              animationDelay: `${dot * 0.1}s`
            }}
          ></div>
        ))}
      </div>
      {message && (
        <p className={`text-red-600 font-medium ${textSizes[size]} mt-3`}>
          {message}
        </p>
      )}
    </div>
  );

  // Main spinner component
  const SpinnerLoader = () => (
    <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
      <div className={`${sizeClasses[size]} border-red-200 border-t-red-600 rounded-full animate-spin mb-3`}></div>
      {message && (
        <p className={`text-red-600 font-medium ${textSizes[size]}`}>
          {message}
        </p>
      )}
    </div>
  );

  // Return appropriate loader based on variant
  switch (variant) {
    case 'skeleton':
      return <SkeletonLoader />;
    case 'progress':
      return <ProgressLoader />;
    case 'dots':
      return <DotsLoader />;
    default:
      return <SpinnerLoader />;
  }
};

export default LoadingSpinner; 