import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { fetchWithRetry } from "@/app/lib/api";

const fetcher = (url) =>
  fetchWithRetry(url, { method: "GET" })
    .then(res => {
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return res.json();
    });

export default function useProdViewerData() {
  const [workers, setWorkers] = useState([]);
  const [payHours, setPayHours] = useState([]);
  const [prodStandards, setProdStandards] = useState([]);

  const { data, error, mutate, isLoading } = useSWR(
    "/api/prodviewerdata",
    fetcher
  );

  useEffect(() => {
    if (data) {
      setWorkers(data.workers ?? []);
      setPayHours(data.payHours ?? []);
      setProdStandards(data.prodStandards ?? []);
    }
  }, [data]);

  const refresh = useCallback(() => {
    mutate();
  }, [mutate]);

  return { workers, payHours, prodStandards, error, isLoading, refresh };
}
