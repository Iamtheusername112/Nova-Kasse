import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to ensure loading state stays true for minimum duration
 * @param {boolean} isLoading - The actual loading state
 * @param {number} minDuration - Minimum duration in milliseconds (default: 3000ms)
 * @returns {boolean} - The controlled loading state that respects minimum duration
 */
export function useMinimumLoadingTime(isLoading, minDuration = 3000) {
  const [displayLoading, setDisplayLoading] = useState(false);
  const loadingStartTimeRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (isLoading) {
      // Start loading - record the time
      if (loadingStartTimeRef.current === null) {
        loadingStartTimeRef.current = Date.now();
      }
      setDisplayLoading(true);
      
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    } else {
      // Loading finished - check if minimum time has passed
      if (loadingStartTimeRef.current !== null) {
        const elapsed = Date.now() - loadingStartTimeRef.current;
        const remainingTime = Math.max(0, minDuration - elapsed);
        
        if (remainingTime > 0) {
          // Wait for remaining time before hiding
          timeoutRef.current = setTimeout(() => {
            setDisplayLoading(false);
            loadingStartTimeRef.current = null;
          }, remainingTime);
        } else {
          // Minimum time has already passed, hide immediately
          setDisplayLoading(false);
          loadingStartTimeRef.current = null;
        }
      }
    }

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading, minDuration]);

  return displayLoading;
}

