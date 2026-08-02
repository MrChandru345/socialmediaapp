import React from "react";

export default function CommentIcon({ size = 28, className = "", color = "currentColor", strokeWidth = 2 }) {
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
      className={`comment-icon-svg ${className}`}
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      <path d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615l3.268.855a.8.8 0 0 0 .986-.986l-.664-3.484z" />
    </svg>
  );
}
