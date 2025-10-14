"use client";

import { useCallback, useRef } from 'react';
import NProgress from 'nprogress';

interface TopBarProgressConfig {
  minimum?: number;
  speed?: number;
  showSpinner?: boolean;
  easing?: string;
  trickleSpeed?: number;
}

export const useTopBarProgress = () => {
  const activeRequests = useRef(0);
  const isConfigured = useRef(false);

  const configure = useCallback((config: TopBarProgressConfig = {}) => {
    if (!isConfigured.current) {
      NProgress.configure({
        minimum: 0.15,
        speed: 400,
        showSpinner: false,
        easing: 'ease-out',
        trickleSpeed: 200,
        ...config
      });
      isConfigured.current = true;
    }
  }, []);

  const start = useCallback(() => {
    configure();
    activeRequests.current += 1;
    
    if (activeRequests.current === 1) {
      NProgress.start();
    }
  }, [configure]);

  const finish = useCallback(() => {
    activeRequests.current = Math.max(0, activeRequests.current - 1);
    
    if (activeRequests.current === 0) {
      NProgress.done();
    }
  }, []);

  const set = useCallback((progress: number) => {
    configure();
    NProgress.set(Math.max(0, Math.min(1, progress)));
  }, [configure]);

  const increment = useCallback(() => {
    configure();
    NProgress.inc();
  }, [configure]);

  const reset = useCallback(() => {
    activeRequests.current = 0;
    NProgress.done();
  }, []);

  return {
    start,
    finish,
    set,
    increment,
    reset,
    configure,
    getActiveRequests: () => activeRequests.current
  };
};

export default useTopBarProgress;