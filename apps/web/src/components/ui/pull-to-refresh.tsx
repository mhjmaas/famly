"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { Spinner } from "./spinner";

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
  threshold?: number;
  maxPullDistance?: number;
  minRefreshDuration?: number;
}

export function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  maxPullDistance = 150,
  minRefreshDuration = 1000,
}: PullToRefreshProps) {
  const [showRefresh, setShowRefresh] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only start tracking if we're at the top of the scroll container
      if (container.scrollTop === 0 && window.scrollY === 0) {
        touchStartY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touchY = e.touches[0].clientY;
      const touchDiff = touchY - touchStartY.current;

      // Only activate if pulling down and at the top
      if (
        touchDiff > 0 &&
        container.scrollTop === 0 &&
        window.scrollY === 0 &&
        !isRefreshing
      ) {
        // Prevent default scrolling when pulling to refresh
        e.preventDefault();

        // Calculate pull distance with diminishing returns for a natural feel
        const distance = Math.min(touchDiff ** 0.85, maxPullDistance);
        setPullDistance(distance);

        if (distance >= threshold) {
          setShowRefresh(true);
        } else {
          setShowRefresh(false);
        }
      }
    };

    const handleTouchEnd = async () => {
      if (showRefresh && !isRefreshing) {
        setIsRefreshing(true);
        const startTime = Date.now();

        try {
          await onRefresh();
        } finally {
          // Ensure spinner shows for at least minRefreshDuration
          const elapsed = Date.now() - startTime;
          const remainingTime = Math.max(0, minRefreshDuration - elapsed);

          if (remainingTime > 0) {
            await new Promise((resolve) => setTimeout(resolve, remainingTime));
          }

          setIsRefreshing(false);
          setShowRefresh(false);
          setPullDistance(0);
        }
      } else {
        // Reset the pull distance with animation
        setPullDistance(0);
        setShowRefresh(false);
      }
      touchStartY.current = 0;
    };

    container.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [
    showRefresh,
    isRefreshing,
    onRefresh,
    threshold,
    maxPullDistance,
    minRefreshDuration,
  ]);

  return (
    <div ref={containerRef} className="relative overflow-y-auto">
      {/* Refresh indicator */}
      <div
        className="absolute left-0 right-0 top-0 flex items-center justify-center transition-all duration-200"
        style={{
          height: isRefreshing ? "60px" : `${pullDistance}px`,
          opacity: pullDistance > 0 || isRefreshing ? 1 : 0,
          transform: `translateY(${isRefreshing ? 0 : -20}px)`,
        }}
      >
        <div
          className={`flex items-center justify-center transition-transform duration-200 ${
            showRefresh || isRefreshing ? "scale-100" : "scale-75"
          }`}
        >
          <Spinner className="h-5 w-5 text-primary" />
        </div>
      </div>

      {/* Content wrapper with padding when refreshing */}
      <div
        className="transition-all duration-200"
        style={{
          paddingTop: isRefreshing ? "60px" : "0px",
        }}
      >
        {children}
      </div>
    </div>
  );
}
