import React from 'react';

interface RadialArrayIconProps {
  className?: string;
  strokeWidth?: number;
}

/**
 * Icon for the radial array (방사상 배열) tool.
 * A ring with arrows radiating outwards – the same shape as the feature
 * itself, so it can not be mistaken for undo/redo.
 */
export const RadialArrayIcon: React.FC<RadialArrayIconProps> = ({
  className = 'w-4 h-4',
  strokeWidth = 1.8,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {/* the ring the copies are arranged on */}
    <circle cx="12" cy="12" r="5.8" />
    {/* arrows pointing away from the centre */}
    <path d="M19.2 12.0L22.6 12.0M20.61 13.34L22.6 12.0L20.61 10.66M17.09 17.09L19.5 19.5M17.14 19.04L19.5 19.5L19.04 17.14M12.0 19.2L12.0 22.6M10.66 20.61L12.0 22.6L13.34 20.61M6.91 17.09L4.5 19.5M4.96 17.14L4.5 19.5L6.86 19.04M4.8 12.0L1.4 12.0M3.39 10.66L1.4 12.0L3.39 13.34M6.91 6.91L4.5 4.5M6.86 4.96L4.5 4.5L4.96 6.86M12.0 4.8L12.0 1.4M13.34 3.39L12.0 1.4L10.66 3.39M17.09 6.91L19.5 4.5M19.04 6.86L19.5 4.5L17.14 4.96" />
  </svg>
);
