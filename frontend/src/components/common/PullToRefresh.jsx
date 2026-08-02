import React, { useState, useRef } from "react";
import { useLocation } from "react-router-dom";

export default function PullToRefresh({ children, onRefresh }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);
  const containerRef = useRef(null);
  const location = useLocation();

  const PULL_THRESHOLD = 65;

  const handleStart = (clientY) => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    if (scrollTop <= 5 && !isRefreshing) {
      startYRef.current = clientY;
      isPullingRef.current = true;
    }
  };

  const handleMove = (clientY, e) => {
    if (!isPullingRef.current || isRefreshing) return;
    const diff = clientY - startYRef.current;
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;

    if (diff > 0 && scrollTop <= 5) {
      const dist = Math.min(diff * 0.45, PULL_THRESHOLD + 20);
      setPullDistance(dist);
      if (e && e.cancelable && dist > 15) {
        e.preventDefault();
      }
    } else {
      setPullDistance(0);
    }
  };

  const handleEnd = async () => {
    if (!isPullingRef.current) return;
    isPullingRef.current = false;

    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD);

      try {
        if (onRefresh) {
          await onRefresh();
        }
        window.dispatchEvent(new CustomEvent("app:pull-refresh", { detail: { pathname: location.pathname } }));
        setTimeout(() => {
          window.location.reload();
        }, 200);
      } catch (err) {
        console.error("Pull-to-refresh error:", err);
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  const onTouchStart = (e) => handleStart(e.touches[0].clientY);
  const onTouchMove = (e) => handleMove(e.touches[0].clientY, e);
  const onTouchEnd = () => handleEnd();

  return (
    <div
      ref={containerRef}
      className="pull-to-refresh-container"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Signature App Conic-Gradient Loading Spinner Pull Indicator */}
      <div
        className={`pull-indicator ${isRefreshing ? "pull-indicator--refreshing" : ""}`}
        style={{
          transform: `translate3d(-50%, ${isRefreshing ? "55px" : `${pullDistance}px`}, 0)`,
          opacity: pullDistance > 10 || isRefreshing ? 1 : 0,
        }}
      >
        <div
          className="pull-gradient-spinner"
          style={{
            transform: isRefreshing ? undefined : `rotate(${pullDistance * 5}deg)`,
          }}
        />
      </div>

      <div
        className="pull-content"
        style={{
          transform: pullDistance > 0 ? `translate3d(0, ${pullDistance * 0.25}px, 0)` : "none",
          transition: isPullingRef.current ? "none" : "transform 0.25s cubic-bezier(0.1, 0.9, 0.2, 1)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
