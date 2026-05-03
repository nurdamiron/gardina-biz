import React from 'react';

export const SkeletonCard = () => (
  <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100 animate-pulse">
    <div className="flex gap-4">
      <div className="flex-1 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-20"></div>
        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-8 bg-gray-200 rounded w-full mt-3"></div>
      </div>
      <div className="w-24 h-24 bg-gray-200 rounded-xl"></div>
    </div>
  </div>
);

export const SkeletonStats = () => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border animate-pulse">
    <div className="flex items-start justify-between mb-6">
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded w-16"></div>
        <div className="h-8 bg-gray-200 rounded w-24"></div>
      </div>
      <div className="flex gap-2">
        <div className="w-[70px] h-16 bg-gray-200 rounded-lg"></div>
        <div className="w-[70px] h-16 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-gray-200 rounded"></div>
      <div className="h-3 bg-gray-200 rounded-full"></div>
    </div>
  </div>
);
