import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";

const fetcher = (url) =>
  fetch(url).then(res => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  });

export default function usePayrollData() {
  const [payHours, setPayHours] = useState({});
  const [workers, setWorkers] = useState({});
  const [timeclock, setTimeclock] = useState([]);
  const [production, setProduction] = useState({});
  const [settings, setSettings] = useState({});

  const { data, error, mutate } = useSWR("/api/payrolldata", fetcher);

  useEffect(() => {
    if (data) {
      setPayHours(data.payHours);
      setWorkers(data.workers);
      setTimeclock(data.timeclock);
      setProduction(data.production);
      setSettings(data.settings);
    }
  }, [data]);

  const refreshAll = useCallback(() => {
    mutate();
  }, [mutate]);
  return {
    payHours,
    setPayHours,
    workers,
    settings,
    timeclock,
    production,
    mutate,
    refreshAll,
    error,
  };
}
