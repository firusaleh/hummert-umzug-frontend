import React from 'react';

export default function LoadingSpinner({ message = 'Lade...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <div className="relative">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <div className="absolute inset-0 rounded-full h-12 w-12 border-t-2 border-indigo-200"></div>
      </div>
      {message && (
        <p className="mt-4 text-sm text-gray-600">{message}</p>
      )}
    </div>
  );
}