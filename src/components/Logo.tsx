import React from 'react';

export const Logo = () => {
  return (
    <svg 
      width="28" 
      height="28" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      role="img"
      aria-label="AdmitGuard logo"
      className="logo-svg"
    >
      {/* Funnel Shape */}
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
      {/* Checklist Ticks */}
      <path d="M10 6l1.5 1.5 3-3" />
      <path d="M10 10l1.5 1.5 3-3" />
    </svg>
  );
};

export default Logo;
