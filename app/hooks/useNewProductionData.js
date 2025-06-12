"use client";

import { useCallback } from "react";
import useSWR from "swr";
import {
  fetchWithRetry
} from "@/app/lib/api";

const fetcher = (url) => {
  return fetchWithRetry(url, { method: "GET" });
}

export default function useNewProductionData() {
  const { data, error, mutate, isLoading } = useSWR(
    "/api/newproduction",
    fetcher
  );

  const refresh = useCallback(() => {
    mutate();
  }, [mutate]);

  return {
    prodStandards: data?.prodStandards ?? {},
    prodDescOptions: data?.prodDescOptions ?? [],
    prodCodeOptions: data?.prodCodeOptions ?? [],
    workersByName: data?.workersByName ?? [],
    leadersList: data?.leadersList ?? [],
    nhifmList: data?.nhifmList ?? [],
    templates: data?.templates ?? {},
    customers: data?.customers ?? [],
    error,
    isLoading,
    refresh,
  };
}
