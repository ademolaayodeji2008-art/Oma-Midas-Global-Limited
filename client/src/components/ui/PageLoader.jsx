/**
 * PageLoader.jsx — Beautiful page transition loader with logo
 */

import React from 'react';

export default function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 backdrop-blur-sm">
      <div className="relative">
        {/* Animated gradient ring */}
        <div className="absolute inset-0 -m-4">
          <div className="w-32 h-32 rounded-full border-4 border-transparent bg-gradient-to-r from-primary via-secondary to-accent animate-spin bg-clip-padding" style={{ borderImage: 'linear-gradient(45deg, #667eea, #764ba2, #f093fb) 1', animationDuration: '2s' }}></div>
        </div>

        {/* Logo container with pulse animation */}
        <div className="relative bg-white rounded-2xl shadow-2xl p-4 w-24 h-24 flex items-center justify-center animate-pulse">
          <img
            src="/logo.jpeg"
            alt="Oma Midas Logo"
            className="w-full h-full object-contain rounded-lg"
          />
        </div>

        {/* Loading text */}
        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          <p className="text-sm font-medium text-primary animate-pulse">Loading...</p>
        </div>

        {/* Orbiting dots */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
          <div className="absolute top-0 left-1/2 w-2 h-2 bg-primary rounded-full -translate-x-1/2"></div>
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s', animationDelay: '0.5s' }}>
          <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-secondary rounded-full -translate-x-1/2"></div>
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s', animationDelay: '1s' }}>
          <div className="absolute left-0 top-1/2 w-2 h-2 bg-accent rounded-full -translate-y-1/2"></div>
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s', animationDelay: '1.5s' }}>
          <div className="absolute right-0 top-1/2 w-2 h-2 bg-primary rounded-full -translate-y-1/2"></div>
        </div>
      </div>
    </div>
  );
}
