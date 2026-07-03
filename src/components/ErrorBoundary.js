'use client'

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="p-4 text-center">
          <h2 className="text-lg font-semibold text-red-600 mb-2">
            कुछ गलत हो गया
          </h2>
          <p className="text-gray-600 mb-4">
            पेज लोड करने में समस्या आई है। कृपया पेज को रिफ्रेश करें।
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            पेज रिफ्रेश करें
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 
