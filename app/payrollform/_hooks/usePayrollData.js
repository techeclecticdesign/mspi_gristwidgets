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

  const { data, error, mutate } = useSWR("/api/payrollData", fetcher);

  useEffect(() => {
    if (data) {
      setPayHours(data.payHours);
      setWorkers(data.workers);
      setTimeclock(data.timeclock);
      setProduction(data.production);
    }
  }, [data]);

  const refreshAll = useCallback(() => {
    mutate();
  }, [mutate]);

  return {
    payHours,
    setPayHours,
    workers,
    timeclock,
    production,
    mutate,
    refreshAll,
    error,
  };
}
