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
    <path d="M19.0 12.0L22.6 12.0M20.65 13.22L22.6 12.0L20.65 10.78M18.06 15.5L21.18 17.3M18.88 17.38L21.18 17.3L20.1 15.27M15.5 18.06L17.3 21.18M15.27 20.1L17.3 21.18L17.38 18.88M12.0 19.0L12.0 22.6M10.78 20.65L12.0 22.6L13.22 20.65M8.5 18.06L6.7 21.18M6.62 18.88L6.7 21.18L8.73 20.1M5.94 15.5L2.82 17.3M3.9 15.27L2.82 17.3L5.12 17.38M5.0 12.0L1.4 12.0M3.35 10.78L1.4 12.0L3.35 13.22M5.94 8.5L2.82 6.7M5.12 6.62L2.82 6.7L3.9 8.73M8.5 5.94L6.7 2.82M8.73 3.9L6.7 2.82L6.62 5.12M12.0 5.0L12.0 1.4M13.22 3.35L12.0 1.4L10.78 3.35M15.5 5.94L17.3 2.82M17.38 5.12L17.3 2.82L15.27 3.9M18.06 8.5L21.18 6.7M20.1 8.73L21.18 6.7L18.88 6.62" />
  </svg>
);
