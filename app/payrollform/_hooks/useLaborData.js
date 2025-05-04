import { useState, useCallback, useMemo } from "react";
import {
  daysOfWeek,
  validDaysOfWeek,
  filterPayRecords,
  getAggregatedWorkHours,
} from "../_util/funcs";

const NUM_PROJECTS = 16;

export default function useLaborData(payHours, weekRanges, filters, timeclock) {
  timeclock = Array.isArray(timeclock) ? timeclock : [];
  const [laborData, setLaborData] = useState(
    Array.from({ length: NUM_PROJECTS }, () => ({
      po_number: "",
      cells: validDaysOfWeek.map(() => ({
        AM: { value: "", error: false, rate: "" },
        PM: { value: "", error: false, rate: "" },
      })),
    }))
  );

  // Load labor data based on current filters.
  const loadLaborData = useCallback(() => {
    if (filters.dateRange === null || filters.mdoc.trim() === "") {
      return;
    }

    // Create an initial fresh array.
    const initialData = Array.from({ length: NUM_PROJECTS }, () => ({
      po_number: "",
      cells: validDaysOfWeek.map(() => ({
        AM: { value: "", error: false, rate: "" },
        PM: { value: "", error: false, rate: "" },
      })),
    }));

    const filteredRecords = filterPayRecords(payHours, filters.mdoc, filters.dateRange, weekRanges);
    if (filteredRecords.length === 0) {
      setLaborData(initialData);
      return;
    }

    const newData = [...initialData];

    // Group records by PO number.
    const poGroups = {};
    filteredRecords.forEach(record => {
      const po = record.po_number;
      poGroups[po] = poGroups[po] || [];
      poGroups[po].push(record);
    });

    let availableIndex = 0;
    for (const po in poGroups) {
      if (availableIndex >= NUM_PROJECTS) break;
      newData[availableIndex].po_number = po;
      const group = poGroups[po];
      group.forEach(record => {
        const recordDate = new Date(record.date_worked * 1000);
        const dayAbbrev = recordDate.toLocaleDateString("en-US", { weekday: "short" });
        const validIndex = validDaysOfWeek.findIndex(day => day === dayAbbrev);
        if (validIndex === -1) return;
        const period = record.period;
        newData[availableIndex].cells[validIndex] = {
          ...newData[availableIndex].cells[validIndex],
          [period]: {
            value: record.laborsheet_hours.toString(),
            error: false,
            rate: record.hourly_rate.toString(),
          },
        };
      });
      availableIndex++;
    }
    setLaborData(newData);
  }, [payHours, filters, weekRanges]);

  // Compute aggregated work hours using timeclock data.
  const aggregatedWorkHours = useMemo(() => {
    if (filters.mdoc.trim() === "" || filters.dateRange === null) return {};
    const currentRange = weekRanges[filters.dateRange];
    if (!currentRange) return {};
    const filteredTimeclock = timeclock
      .filter(record => record.mdoc.toString() === filters.mdoc.trim())
      .filter(record => {
        if (!record.scan_datetime) return false;
        const scanDate = new Date(record.scan_datetime * 1000).getTime();
        return (
          scanDate >= currentRange.start.getTime() &&
          scanDate <= currentRange.end.getTime()
        );
      });
    return getAggregatedWorkHours(filteredTimeclock, daysOfWeek);
  }, [timeclock, filters, weekRanges]);

  return { laborData, setLaborData, loadLaborData, aggregatedWorkHours };
}
