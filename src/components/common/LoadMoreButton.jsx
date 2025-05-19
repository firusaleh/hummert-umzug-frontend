// components/common/LoadMoreButton.jsx
import React from 'react';

const LoadMoreButton = ({ 
  onClick, 
  loading, 
  hasMore, 
  text = 'Mehr laden',
  loadingText = 'Lädt...',
  noMoreText = 'Alle Einträge geladen',
  className = ''
}) => {
  if (!hasMore) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500">{noMoreText}</p>
      </div>
    );
  }

  return (
    <div className="text-center py-4">
      <button
        onClick={onClick}
        disabled={loading}
        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed ${className}`}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {loadingText}
          </>
        ) : (
          text
        )}
      </button>
    </div>
  );
};

export default LoadMoreButton;