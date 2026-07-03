import React from 'react';

const LoadingSpinner = ({
  size = "md",
  message = "लोड हो रहा है...",
  className = "",
  variant = "spinner",
  skeletonCount = 4,
  skeletonMinWidth = 220,
  skeletonAspect = "16 / 9",
  showSkeletonHeader = true,
}) => {
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

  const skeletonItems = Array.from({ length: skeletonCount }, (_, index) => index);

  // Responsive skeleton component. It adapts to the available container width
  // without measuring the DOM, which keeps the loading state cheap to render.
  const SkeletonLoader = () => (
    <div className={`space-y-4 ${className}`} aria-label={message} role="status">
      {showSkeletonHeader && (
        <div className="animate-pulse space-y-2">
          <div className="h-4 w-3/4 max-w-lg rounded bg-gray-200"></div>
          <div className="h-4 w-1/2 max-w-md rounded bg-gray-200"></div>
          <div className="h-4 w-2/3 max-w-xl rounded bg-gray-200"></div>
        </div>
      )}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${skeletonMinWidth}px), 1fr))` }}
      >
        {skeletonItems.map((item) => (
          <div key={item} className="animate-pulse rounded-lg border border-gray-100 bg-white p-2 shadow-sm">
            <div className="mb-3 rounded-md bg-gray-200" style={{ aspectRatio: skeletonAspect }}></div>
            <div className="mb-2 h-4 w-3/4 rounded bg-gray-200"></div>
            <div className="mb-3 h-4 w-1/2 rounded bg-gray-200"></div>
            <div className="flex gap-2">
              <div className="h-3 w-16 rounded bg-gray-100"></div>
              <div className="h-3 w-20 rounded bg-gray-100"></div>
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">{message}</span>
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
