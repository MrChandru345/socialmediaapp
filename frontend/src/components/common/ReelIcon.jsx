import React from "react";

export default function ReelIcon({ size = 22, className = "", color = "currentColor", strokeWidth = 2.2 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`reel-icon-svg ${className}`}
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      {/* Outer rounded squircle frame */}
      <rect x="3" y="3" width="18" height="18" rx="6" ry="6" />
      {/* Centered play triangle with rounded corners */}
      <path
        d="M9.5 8.5L16 12L9.5 15.5V8.5Z"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
