import { getAggregatedWorkHours, daysOfWeek, validDaysOfWeek, getLocalMidnightTs } from "./funcs";

export async function updateBackendRecord(
  { filters, weekRanges, filteredTimeclock },
  { rowIndex, dayIndex, timeOfDay, poNumber, value, rate }
) {
  if (filters.dateRange === null || filters.mdoc.trim() === "") return;

  const selectedWeek = weekRanges[filters.dateRange];
  const workDate = new Date(selectedWeek.start);
  const currentValue = value;
  const currentRate = rate;
  const aggregatedWorkHours = getAggregatedWorkHours(filteredTimeclock, daysOfWeek);

  const actualDayIndex = daysOfWeek.findIndex(
    (day) => day.trim() !== "" && day === validDaysOfWeek[dayIndex]
  );

  const timeclock_hours = aggregatedWorkHours[daysOfWeek[actualDayIndex]][timeOfDay];
  workDate.setDate(workDate.getDate() + actualDayIndex);
  const ts = getLocalMidnightTs(workDate);
  // Build the payload for the API.
  const payload = {
    mdoc: filters.mdoc,
    po_number: poNumber,
    date_worked: ts,
    date_entered: Math.floor(Date.now() / 1000),
    period: timeOfDay,
    laborsheet_hours: parseFloat(currentValue) || 0,
    hourly_rate: parseFloat(currentRate) || -1,
    timeclock_hours,
  };

  // If labor entry is blank or 0, delete the record.
  if (currentValue === "" || parseFloat(currentValue) === 0) {
    await deleteBackendRecord({ filters, workDate, poNumber, timeOfDay });
    return;
  }

  const queryParams = new URLSearchParams({
    po_number: poNumber,
    date_worked: payload.date_worked,
    period: timeOfDay,
  });
  const checkResponse = await fetch(`/api/payhours?${queryParams.toString()}`);
  if (!checkResponse.ok) {
    throw new Error(`HTTP error during check! status: ${checkResponse.status}`);
  }
  const existingRecords = await checkResponse.json();

  if (existingRecords.records.length > 0) {
    const updatePayload = {
      po_number: payload.po_number,
      date_worked: payload.date_worked,
      period: payload.period,
      laborsheet_hours: payload.laborsheet_hours,
      hourly_rate: payload.hourly_rate,
      timeclock_hours: payload.timeclock_hours,
      date_entered: payload.date_entered,
    };
    const updateResponse = await fetch("/api/payhours", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatePayload),
    });
    if (!updateResponse.ok) {
      throw new Error(`HTTP error during update! status: ${updateResponse.status}`);
    }
    const updateData = await updateResponse.json();
    console.log("Record successfully updated:", updateData);
  } else {
    const addResponse = await fetch("/api/payhours", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!addResponse.ok) {
      throw new Error(`HTTP error during add! status: ${addResponse.status}`);
    }
    const addData = await addResponse.json();
    console.log("Record successfully added:", addData);
  }
  return payload;
}

export async function deleteBackendRecord({ filters, workDate, poNumber, timeOfDay }) {
  try {
    const ts = getLocalMidnightTs(workDate);
    const queryParams = new URLSearchParams({
      po_number: poNumber,
      date_worked: ts,
      period: timeOfDay,
    });
    const response = await fetch(`/api/payhours?${queryParams.toString()}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error(`HTTP error during delete! status: ${response.status}`);
    }
    console.log(`Deleted record for ${poNumber} on ${workDate} ${timeOfDay}`);
  } catch (error) {
    console.error("Error deleting record:", error);
    throw error;
  }
}

export async function batchUpdateBackendRecords(newLaborData, updateBackendRecordFn) {
  const updatePromises = [];
  newLaborData.forEach((entry, rowIndex) => {
    if (entry.po_number.trim() === "") return;
    entry.cells.forEach((cell, dayIndex) => {
      ["AM", "PM"].forEach((timeOfDay) => {
        const { value, rate } = cell[timeOfDay];
        if (value.trim() !== "" && value != 0) {
          updatePromises.push(
            updateBackendRecordFn({ rowIndex, dayIndex, timeOfDay, poNumber: entry.po_number, value, rate })
          );
        }
      });
    });
  });
  return Promise.all(updatePromises);
}
