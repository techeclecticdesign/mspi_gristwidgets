import { getWeekRanges } from '/app/lib/util.js';
export { getWeekRanges };

const aggregateWorkHours = (records) => {
  const result = {};
  validDaysOfWeek.forEach((day) => {
    result[day] = { AM: 0, PM: 0 };
  });

  const enrichedRecords = records.map(record => {
    const timestamp = record.fields.scan_datetime;
    const dateObj = new Date(timestamp * 1000);
    return { ...record, dateObj };
  });

  enrichedRecords.sort((a, b) => a.dateObj - b.dateObj);

  // stack method for pairing "In" / "Out" records.
  const inStack = [];
  for (let rec of enrichedRecords) {
    if (rec.fields.status === "In") {
      inStack.push(rec);
    } else if (rec.fields.status === "Out" && inStack.length) {
      const inRec = inStack.shift();
      if (rec.dateObj > inRec.dateObj) {
        const inTime = inRec.dateObj;
        const outTime = rec.dateObj;
        const worked = splitWorkedTime(inTime, outTime);
        const dayName = inTime.toLocaleDateString("en-US", { weekday: "short" });
        if (result[dayName] !== undefined) {
          result[dayName].AM += Math.round(worked.AM * 100) / 100;
          result[dayName].PM += Math.round(worked.PM * 100) / 100;
        }
      }
    }
  }

  return result;
};

const splitWorkedTime = (inTime, outTime) => {
  const msPerHour = 1000 * 60 * 60;
  const boundary = new Date(inTime);
  boundary.setHours(11, 0, 0, 0);
  let amHours = 0;
  let pmHours = 0;
  if (outTime <= boundary) {
    amHours = (outTime - inTime) / msPerHour;
  } else if (inTime >= boundary) {
    pmHours = (outTime - inTime) / msPerHour;
  } else {
    amHours = (boundary - inTime) / msPerHour;
    pmHours = (outTime - boundary) / msPerHour;
  }
  return { AM: amHours, PM: pmHours };
};

export const daysOfWeek = process.env.NEXT_PUBLIC_DAYS_OF_WEEK?.split(",") || [];
export const validDaysOfWeek = daysOfWeek.filter(day => day.trim() !== "");
export const formatDate = (date) => date.toLocaleDateString();

// function for rounding
export const distributeRounded = (total, rawValues) => {
  const floorCents = rawValues.map(val => Math.floor(val * 100));
  const sumFloor = floorCents.reduce((acc, cur) => acc + cur, 0);
  const targetCents = Math.round(total * 100);
  let diff = targetCents - sumFloor;
  const remainders = rawValues.map(val => (val * 100) - Math.floor(val * 100));
  const indicesByRemainder = [...remainders.keys()].sort((i, j) => remainders[j] - remainders[i]);
  const distributedCents = [...floorCents];
  for (let i = 0; i < indicesByRemainder.length && diff > 0; i++) {
    distributedCents[indicesByRemainder[i]] += 1;
    diff--;
  }
  return distributedCents;
};

// filter payHours records based on mdoc and dateRange
export const filterPayRecords = (payHours, mdoc, dateRange, weekRanges) => {
  if (!payHours || !payHours[mdoc]) {
    return [];
  }
  const weekRange = weekRanges[dateRange];
  if (!weekRange) return [];

  const ws = getLocalMidnightTs(weekRange.start);
  const we = getLocalMidnightTs(weekRange.end) + 24 * 60 * 60 - 1;

  return payHours[mdoc].filter(record => {
    const ts = record.date_worked;
    return ts >= ws && ts <= we;
  });
};

// Sums values for a specific day and period across labor data
export const sumForDayAndTime = (dayIndex, timeOfDay, laborData) => {
  return parseFloat(
    Object.values(laborData).reduce((total, poEntry) => {
      const fieldValue = parseFloat(poEntry.cells[dayIndex]?.[timeOfDay]?.value) || 0;
      return total + fieldValue;
    }, 0).toFixed(2)
  );
};

/* Given a JS Date, zeroes it to local‐midnight and returns the UNIX epoch seconds. */
export function getLocalMidnightTs(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.floor(d.getTime() / 1000);
}

export const calcDefaultWage = (poNumber, mdoc, workers, production) => {
  const foundKey = Object.keys(production).find((key) => key === poNumber);
  if (production[foundKey].pie) {
    return process.env.NEXT_PUBLIC_PIE_WAGE;
  }
  if (production[foundKey].nhifm) {
    return 0;
  }
  return workers[mdoc].pay_rate;
}

export const isPaidOnNhifmDay = (poNumber, mdoc, workers, production, day) => {
  const foundKey = Object.keys(production).find((key) => key === poNumber);
  let falsey = false;
  const nhifm_unpaid_days = process.env.NEXT_PUBLIC_NHIFM_UNPAID_DAYS.split(",") || [];
  if (workers[mdoc].nhifm_worker) {
    nhifm_unpaid_days.forEach((unpaidDay) => {
      if (unpaidDay == day) {
        if (production[foundKey].payable_on_nh_days == "False") {
          falsey = true;
        }
      }
    })
  }
  if (falsey) {
    return false;
  }
  return true;
}

export const getAggregatedWorkHours = (records, days = validDaysOfWeek) => {
  if (!records || records.length === 0) {
    const emptyResult = {};
    days.forEach(day => {
      emptyResult[day] = { AM: 0, PM: 0 };
    });
    return emptyResult;
  }
  return aggregateWorkHours(records, days);
};

function formatValue(num) {
  return parseFloat(num.toFixed(2)).toString();
}

// Automatically fix common laborsheet mistakes made by crewbosses
export function balanceLaborData(
  laborData,
  aggregatedWorkHours,
  validDaysOfWeek,
  daysOfWeek,
  weekRanges,
  dateRange,
  distributeRounded
) {
  // Record deletion queue
  const deletionRequests = [];

  const newLaborData = laborData.map((entry) => ({
    po_number: entry.po_number,
    cells: entry.cells.map((cell) => ({ ...cell })),
    mergedOut: false,
  }));

  // Merge entries with the same PO
  const poGroups = {};
  newLaborData.forEach((entry, index) => {
    const po = entry.po_number.trim();
    if (po) {
      (poGroups[po] = poGroups[po] || []).push(index);
    }
  });

  Object.keys(poGroups).forEach((po) => {
    const indices = poGroups[po];
    if (indices.length > 1) {
      const targetIndex = indices[0];
      indices.slice(1).forEach((idx) => {
        newLaborData[targetIndex].cells = newLaborData[targetIndex].cells.map((cell, dayIdx) => {
          const cellToCombine = newLaborData[idx].cells[dayIdx];
          const sumAM = (parseFloat(cell.AM.value) || 0) + (parseFloat(cellToCombine.AM.value) || 0);
          const sumPM = (parseFloat(cell.PM.value) || 0) + (parseFloat(cellToCombine.PM.value) || 0);
          return {
            AM: { ...cell.AM, value: sumAM.toString() },
            PM: { ...cell.PM, value: sumPM.toString() },
          };
        });
        newLaborData[idx].po_number = "";
        newLaborData[idx].mergedOut = true;
        newLaborData[idx].cells = newLaborData[idx].cells.map(() => ({
          AM: { value: "", error: false, rate: "" },
          PM: { value: "", error: false, rate: "" },
        }));
      });
    }
  });

  // Pre-cache target hours from aggregatedWorkHours
  const targets = {};
  validDaysOfWeek.forEach((day) => {
    targets[day] = {
      AM: (aggregatedWorkHours[day] && aggregatedWorkHours[day].AM) || 0,
      PM: (aggregatedWorkHours[day] && aggregatedWorkHours[day].PM) || 0,
    };
  });

  // Build target periods and source entries
  const targetPeriods = [];
  const sourceEntries = { AM: [], PM: [] };

  validDaysOfWeek.forEach((day, dayIndex) => {
    ["AM", "PM"].forEach((period) => {
      let totalLabor = 0;
      newLaborData.forEach((entry) => {
        totalLabor += parseFloat(entry.cells[dayIndex][period].value) || 0;
      });
      const target = targets[day][period];
      if (target > 0 && totalLabor === 0) {
        targetPeriods.push({ dayIndex, period, targetHours: target });
      }
      if (target === 0) {
        newLaborData.forEach((entry, compIdx) => {
          if (!entry.po_number.trim() || entry.mergedOut) return;
          const cellValue = parseFloat(entry.cells[dayIndex][period].value) || 0;
          if (cellValue > 0) {
            sourceEntries[period].push({
              dayIndex,
              period,
              componentIdx: compIdx,
              value: cellValue,
              po_number: entry.po_number,
            });
          }
        });
      }
    });
  });

  // Process target periods
  targetPeriods.forEach((targetInfo) => {
    const { dayIndex: targetDayIndex, period, targetHours } = targetInfo;
    const eligibleSources = sourceEntries[period];
    if (!eligibleSources || eligibleSources.length === 0) return;
    const count = eligibleSources.length;
    const splitValue = targetHours / count;
    eligibleSources.forEach((source) => {
      newLaborData[source.componentIdx].cells[source.dayIndex][period].value = "";
      const selectedWeek = weekRanges[dateRange];
      const workDate = new Date(selectedWeek.start);
      const validDay = validDaysOfWeek[source.dayIndex];
      const offset = daysOfWeek.indexOf(validDay);
      if (offset === -1) {
        console.error("Valid day not found in daysOfWeek", validDay);
      } else {
        workDate.setDate(workDate.getDate() + offset);
      }
      deletionRequests.push({
        po_number: source.po_number,
        workDate,
        period,
      });
      // Merge the split value into the target cell.
      const currentTargetVal =
        parseFloat(newLaborData[source.componentIdx].cells[targetDayIndex][period].value) || 0;
      const newVal = currentTargetVal + splitValue;
      newLaborData[source.componentIdx].cells[targetDayIndex][period].value = formatValue(newVal);
    });
    sourceEntries[period] = [];
  });

  // Redistribution of Extra Labor Entries
  newLaborData.forEach((entry) => {
    ["AM", "PM"].forEach((period) => {
      const targetIndices = [];
      const extraIndices = [];
      validDaysOfWeek.forEach((day, dayIndex) => {
        const target = targets[day][period];
        if (target > 0) {
          targetIndices.push(dayIndex);
        } else if (entry.cells[dayIndex][period].value.trim() !== "") {
          extraIndices.push(dayIndex);
        }
      });
      if (extraIndices.length > 0 && targetIndices.length > 0) {
        const extraTotal = extraIndices.reduce(
          (sum, dayIdx) => sum + (parseFloat(entry.cells[dayIdx][period].value) || 0),
          0
        );
        const count = targetIndices.length;
        const rawArray = Array(count).fill(extraTotal / count);
        const distributedCents = distributeRounded(extraTotal, rawArray);
        targetIndices.forEach((targetDayIdx, idx) => {
          const currentVal = parseFloat(entry.cells[targetDayIdx][period].value) || 0;
          const addition = distributedCents[idx] / 100;
          entry.cells[targetDayIdx][period].value = formatValue(currentVal + addition);
        });
        extraIndices.forEach((extraDayIdx) => {
          entry.cells[extraDayIdx][period].value = "";
        });
      }
    });
  });

  // Equal split when no entries are allocated
  validDaysOfWeek.forEach((day, dayIndex) => {
    ["AM", "PM"].forEach((period) => {
      const target = targets[day][period];
      if (target > 0) {
        let allocationExists = false;
        newLaborData.forEach((entry) => {
          if (parseFloat(entry.cells[dayIndex][period].value) > 0) allocationExists = true;
        });
        if (!allocationExists) {
          const validEntries = newLaborData.filter((entry) => entry.po_number.trim() && !entry.mergedOut);
          if (validEntries.length === 0) return;
          const count = validEntries.length;
          const rawArray = Array(count).fill(target / count);
          const distributedCents = distributeRounded(target, rawArray);
          validEntries.forEach((entry, idx) => {
            entry.cells[dayIndex][period].value = formatValue(distributedCents[idx] / 100);
            entry.cells[dayIndex][period].equalSplitApplied = true;
          });
        }
      }
    });
  });

  // Ratio-Balancing step
  validDaysOfWeek.forEach((day, dayIndex) => {
    ["AM", "PM"].forEach((period) => {
      const entriesToAdjust = [];
      newLaborData.forEach((entry) => {
        const val = parseFloat(entry.cells[dayIndex][period].value) || 0;
        if (val > 0) entriesToAdjust.push(val);
      });
      const target = targets[day][period];
      if (entriesToAdjust.length === 0 || target === 0) return;
      const totalLabor = entriesToAdjust.reduce((a, b) => a + b, 0);
      const rawScaled = entriesToAdjust.map((val) => (val * target) / totalLabor);
      const distributedCents = distributeRounded(target, rawScaled);
      let j = 0;
      newLaborData.forEach((entry) => {
        const currentVal = parseFloat(entry.cells[dayIndex][period].value) || 0;
        if (currentVal > 0) {
          entry.cells[dayIndex][period].value = formatValue(distributedCents[j] / 100)
          j++;
        }
      });
    });
  });
  return { laborData: newLaborData, deletionRequests };
}
