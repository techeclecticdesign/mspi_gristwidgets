import React, { useState, useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import POInput from "./POInput";
import DayRow from "./DayRow";
const RateModal = React.lazy(() => import("./RateModal"));
import WarningModal from "./WarningModal";
import NhifmModal from "./NhifmModal";
import { calcDefaultWage, isPaidOnNhifmDay, validDaysOfWeek } from "../_util/funcs";

export default function LaborForWeekPO({
  rowIndex,
  production,
  onPoChange,
  onChange,
  onBlur,
  onRateChange,
  laborEntry,
  mdoc,
  workers,
  setSnackbarOpen,
  setSnackbarMessage,
  filters
}) {

  const { po_number, cells } = laborEntry;
  const [poNumber, setPoNumber] = useState(po_number);
  const [poError, setPoError] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [defaultWage, setDefaultWage] = useState();
  const [currentPayEditing, setCurrentPayEditing] = useState({
    dayIndex: null,
    timeOfDay: null,
    rate: "",
  });

  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [nhifmModalOpen, setNhifmModalOpen] = useState(false);

  // For tracking input values on focus for later comparison
  const originalValuesRef = useRef({});

  // Sync external po_number changes with local state
  useEffect(() => {
    setPoNumber(po_number);
  }, [po_number]);

  // Event Handlers

  const handleHoursFocus = (dayIndex, timeOfDay) => (e) => {
    const key = `${dayIndex}_${timeOfDay}`;
    originalValuesRef.current[key] = e.target.value;
  };

  const handleHoursChange = (dayIndex, timeOfDay) => (e) => {
    const value = e.target.value;
    onChange(rowIndex, dayIndex, timeOfDay, value, poNumber, poError);
  };

  const handleHoursBlur = (dayIndex, timeOfDay) => (e) => {
    const value = e.target.value;
    const key = `${dayIndex}_${timeOfDay}`;
    const originalValue = originalValuesRef.current[key];
    if (value !== originalValue) {
      onBlur(rowIndex, dayIndex, timeOfDay, poNumber, poError, value);
    }

    // Prompt for NHIFM flag update on Friday or Sunday
    const dayName = validDaysOfWeek[dayIndex].toLowerCase();
    if (["fri", "sun"].includes(dayName)) {
      const workerData = workers[mdoc];
      if (workerData?.nhifm_worker) {
        const prodData = production[poNumber];
        if (prodData && prodData.nhifm === false && prodData.payable_on_nh_days === "") {
          setNhifmModalOpen(true);
        }
      }
    }
  };

  const openRateModal = (dayIndex, timeOfDay) => {
    if (!poNumber.trim()) {
      setWarningModalOpen(true);
      return;
    }
    let currentRate = cells[dayIndex][timeOfDay].rate ?? -1;
    if (currentRate == -1) {
      currentRate = defaultWage;
    }
    setCurrentPayEditing({ dayIndex, timeOfDay, rate: currentRate });
    setRateModalOpen(true);
  };

  const handleSaveRate = () => {
    onRateChange(rowIndex, currentPayEditing.dayIndex, currentPayEditing.timeOfDay, currentPayEditing.rate);
    setRateModalOpen(false);
  };

  const handlePoNumberChange = (e) => {
    const value = e.target.value;
    setPoNumber(value);

    // Validate PO number format (e.g., "1234-5678")
    const regex = /^\d{4}-\d{4}$/;
    if (!value || !regex.test(value)) {
      setPoError(true);
      return;
    }
    const foundKey = Object.keys(production).includes(value);
    setPoError(!foundKey);
  };

  const handlePoNumberBlur = (e) => {
    if (!mdoc || !filters.dateRange) {
      setSnackbarMessage("Mdoc and date must be selected.");
      setSnackbarOpen(true);
      return;
    }
    const value = e.target.value;
    const regex = /^\d{4}-\d{4}$/;
    if (!value) {
      setPoError(false);
      return;
    }
    if (regex.test(value)) {
      const foundKey = Object.keys(production).includes(value);
      setPoError(!foundKey);
      const defaultWageCalculated = calcDefaultWage(value, mdoc, workers, production);
      setDefaultWage(defaultWageCalculated);
      // Set hourly rates for each day according to the NHIFM policy
      validDaysOfWeek.forEach((day, dayIndex) => {
        ["AM", "PM"].forEach((timeOfDay) => {
          const isNhifm = isPaidOnNhifmDay(value, mdoc, workers, production, day);
          onRateChange(rowIndex, dayIndex, timeOfDay, isNhifm ? defaultWageCalculated : 0);
        });
      });
      onPoChange(rowIndex, value);
    } else {
      setPoError(true);
    }
  };

  const updateProdNhFlag = async (poNumber, payableValue) => {
    const payload = { po_number: poNumber, payable_on_nh_days: payableValue };
    try {
      const response = await fetch("/api/production", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(`HTTP error during production update! status: ${response.status}`);
      }
      const data = await response.json();
      production[poNumber]["payable_on_nh_days"] = payableValue;
      // If set to false, update Friday and Sunday wages to 0
      if (payableValue === false) {
        validDaysOfWeek.forEach((day, dayIndex) => {
          if (["fri", "sun"].includes(day.toLowerCase())) {
            ["AM", "PM"].forEach((timeOfDay) => {
              onRateChange(rowIndex, dayIndex, timeOfDay, 0);
            });
          }
        });
      }
      console.log("Production record updated:", data);
    } catch (error) {
      console.error("Error updating production record:", error);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        border: "1px solid #ccc",
        borderRadius: "8px",
        padding: 0.3,
        width: "120px",
      }}
    >
      <POInput
        value={poNumber}
        error={poError}
        onChange={handlePoNumberChange}
        onBlur={handlePoNumberBlur}
        projectName={projectName}
      />
      {validDaysOfWeek.map((day, dayIndex) => (
        <DayRow
          key={day}
          day={day}
          dayIndex={dayIndex}
          cells={cells}
          onHoursFocus={handleHoursFocus}
          onHoursChange={handleHoursChange}
          onHoursBlur={handleHoursBlur}
          onDoubleClick={openRateModal}
        />
      ))}
      <RateModal
        open={rateModalOpen}
        poNumber={poNumber}
        day={
          currentPayEditing.dayIndex !== null
            ? validDaysOfWeek[currentPayEditing.dayIndex]
            : ""
        }
        timeOfDay={currentPayEditing.timeOfDay}
        rate={currentPayEditing.rate}
        onRateChange={(newRate) =>
          setCurrentPayEditing((prev) => ({ ...prev, rate: newRate }))
        }
        onSave={handleSaveRate}
        onCancel={() => setRateModalOpen(false)}
      />
      <WarningModal open={warningModalOpen} onClose={() => setWarningModalOpen(false)} />
      <NhifmModal
        open={nhifmModalOpen}
        onConfirm={() => {
          updateProdNhFlag(poNumber, true);
          setNhifmModalOpen(false);
        }}
        onDeny={() => {
          updateProdNhFlag(poNumber, false);
          setNhifmModalOpen(false);
        }}
      />
    </Box>
  );
}
