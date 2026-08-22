"use client";

import { useState, useEffect, useCallback } from "react";

interface ResilientFetchState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  isFallback: boolean;
  lastUpdated: string | null;
}

export function useResilientFetch<T>(url: string, defaultData: T | null = null) {
  const [state, setState] = useState<ResilientFetchState<T>>({
    data: defaultData,
    loading: true,
    error: null,
    isFallback: false,
    lastUpdated: null,
  });

  const cacheKey = `resilient_cache_${url}`;

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));

    // 1. Try local storage cache first for instant initial render
    let cachedValue: T | null = null;
    let cachedTime: string | null = null;

    if (typeof window !== "undefined") {
      try {
        const item = localStorage.getItem(cacheKey);
        if (item) {
          const parsed = JSON.parse(item);
          cachedValue = parsed.data;
          cachedTime = parsed.timestamp;
        }
      } catch (e) {
        console.warn("[ResilientFetch] Error reading local cache:", e);
      }
    }

    try {
      const response = await fetch(url, {
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      const freshData = await response.json();
      const now = new Date().toISOString();

      // Save fresh data to local cache
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(cacheKey, JSON.stringify({ data: freshData, timestamp: now }));
        } catch (e) {}
      }

      setState({
        data: freshData,
        loading: false,
        error: null,
        isFallback: false,
        lastUpdated: now,
      });
    } catch (err: any) {
      console.warn(`[ResilientFetch] API fetch failed for ${url}. Engaging cached fallback:`, err?.message || err);

      setState({
        data: cachedValue || defaultData,
        loading: false,
        error: err instanceof Error ? err : new Error(String(err)),
        isFallback: true,
        lastUpdated: cachedTime,
      });
    }
  }, [url, cacheKey, defaultData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...state,
    refetch: fetchData,
  };
}
