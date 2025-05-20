"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import LaborForWeekPO from "./_components/LaborForWeekPO";
import { getWeekRanges } from '/app/lib/util.js';
import {
    daysOfWeek,
    validDaysOfWeek,
    balanceLaborData,
    formatDate,
    sumForDayAndTime,
    distributeRounded,
    getLocalMidnightTs
} from "./_util/funcs";
import { updateBackendRecord, deleteBackendRecord, batchUpdateBackendRecords } from "./_util/api";
import usePayrollData from "./_hooks/usePayrollData";
import useLaborData from "./_hooks/useLaborData";

export default function PayrollForm() {
    const weekRanges = useMemo(() => getWeekRanges(), []);
    const { payHours, setPayHours, workers, timeclock, production, mutate } = usePayrollData();
    const [filters, setFilters] = useState({ name: "", mdoc: "", dateRange: null });
    const { laborData, setLaborData, loadLaborData, aggregatedWorkHours } =
        useLaborData(payHours, weekRanges, filters, timeclock);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [workerBalances, setWorkerBalances] = useState({});
    const pendingOnBlur = useRef(false);
    const nameOptions = useMemo(
        () =>
            Object.entries(workers).map(([mdoc, w]) => ({
                label: w.name,
                mdoc,
            })),
        [workers]
    );

    const updateLaborEntry = (rowIndex, dayIndex, timeOfDay, value, errorFlag = false) => {
        setLaborData(prevData =>
            prevData.map((slot, rIdx) =>
                rIdx !== rowIndex
                    ? slot
                    : {
                        ...slot,
                        cells: slot.cells.map((cell, dIdx) =>
                            dIdx !== dayIndex
                                ? cell
                                : { ...cell, [timeOfDay]: { ...cell[timeOfDay], value, error: errorFlag } }
                        ),
                    }
            )
        );
    };

    const deleteBackendRecordHandler = async (poNumber, workDate, timeOfDay) => {
        try {
            await deleteBackendRecord({ filters, workDate, poNumber, timeOfDay });
            setPayHours(prevPayHours => {
                const newPayHours = { ...prevPayHours };
                const targetTimestamp = getLocalMidnightTs(workDate);
                newPayHours[filters.mdoc] = newPayHours[filters.mdoc].filter(
                    record =>
                        record.po_number !== poNumber ||
                        record.date_worked !== targetTimestamp ||
                        record.period !== timeOfDay
                );
                return newPayHours;
            });
        } catch (error) {
            console.error("Error deleting record:", error);
        }
    };

    const handlePoChange = useCallback(
        async (rowIndex, newPo) => {
            const oldPo = laborData[rowIndex].po_number;

            // optimistic state update
            setLaborData(prev =>
                prev.map((entry, idx) =>
                    idx === rowIndex ? { ...entry, po_number: newPo } : entry
                )
            );

            try {
                const start = weekRanges[filters.dateRange].start;
                const dateMap = {};
                for (let i = 0; i < 7; i++) {
                    const d = new Date(start);
                    d.setHours(0, 0, 0, 0);
                    d.setDate(start.getDate() + i);
                    const abbr = d.toLocaleDateString("en-US", { weekday: "short" });
                    dateMap[abbr] = d;
                }

                // Delete PO
                if (oldPo && newPo.trim() === "") {
                    const dels = [];

                    laborData[rowIndex].cells.forEach((cell, vi) => {
                        ["AM", "PM"].forEach(period => {
                            const { value } = cell[period];
                            if (!value) return;

                            const dayAbbr = validDaysOfWeek[vi];
                            const wd = dateMap[dayAbbr];
                            if (!wd) return;

                            dels.push(deleteBackendRecordHandler(oldPo, wd, period));
                        });
                    });

                    await Promise.all(dels);

                    // clear out state
                    setLaborData(prev =>
                        prev.map((entry, idx) =>
                            idx === rowIndex
                                ? {
                                    ...entry,
                                    po_number: "",
                                    cells: entry.cells.map(() => ({
                                        AM: { value: "", error: false, rate: "" },
                                        PM: { value: "", error: false, rate: "" },
                                    })),
                                }
                                : entry
                        )
                    );
                }

                // Change PO
                else if (oldPo && newPo.trim() && oldPo !== newPo) {
                    // first delete all old‐PO entries
                    const dels = [];
                    laborData[rowIndex].cells.forEach((cell, vi) => {
                        ["AM", "PM"].forEach(period => {
                            const { value } = cell[period];
                            if (!value) return;

                            const dayAbbr = validDaysOfWeek[vi];
                            const wd = dateMap[dayAbbr];
                            if (!wd) return;

                            dels.push(deleteBackendRecordHandler(oldPo, wd, period));
                        });
                    });
                    await Promise.all(dels);

                    // recreate under newPo
                    const ups = [];
                    laborData[rowIndex].cells.forEach((cell, vi) => {
                        ["AM", "PM"].forEach(period => {
                            const { value, rate } = cell[period];
                            if (!value) return;

                            const dayAbbr = validDaysOfWeek[vi];
                            const wd = dateMap[dayAbbr];
                            if (!wd) return;

                            ups.push(
                                updateBackendRecord(
                                    { filters, weekRanges },
                                    {
                                        rowIndex,
                                        dayIndex: vi,
                                        timeOfDay: period,
                                        poNumber: newPo,
                                        value,
                                        rate,
                                    }
                                )
                            );
                        });
                    });
                    await Promise.all(ups);

                    // update local state
                    setLaborData(prev =>
                        prev.map((entry, idx) =>
                            idx === rowIndex ? { ...entry, po_number: newPo } : entry
                        )
                    );
                }

                // revalidate
                mutate();
            } catch (err) {
                console.error("PO change failed:", err);
                setSnackbarMessage("Oops! Couldn’t update PO on the backend.");
                setSnackbarOpen(true);
            }
        },
        [laborData, weekRanges, filters, setLaborData, deleteBackendRecordHandler, updateBackendRecord, mutate]
    );


    const handleLaborChange = useCallback((rowIndex, dayIndex, timeOfDay, value) => {
        const isError = value === "" ? false : !/^[+-]?(\d+(\.\d*)?|(\.\d+))$/.test(value);
        updateLaborEntry(rowIndex, dayIndex, timeOfDay, value, isError);
    },
        [updateLaborEntry]
    );

    const handleLaborBlur = async (
        rowIndex, dayIndex, timeOfDay, poNumber, poError
    ) => {
        if (pendingOnBlur.current) {
            setTimeout(
                () => handleLaborBlur(rowIndex, dayIndex, timeOfDay, poNumber, poError),
                50
            );
            return;
        }

        // bad PO.  reset & alert.
        if (poError || !poNumber.trim()) {
            updateLaborEntry(rowIndex, dayIndex, timeOfDay, "", false);
            setSnackbarMessage("Entries with bad PO Numbers were not submitted.");
            setSnackbarOpen(true);
            return;
        }

        const { value, rate } = laborData[rowIndex].cells[dayIndex][timeOfDay];
        updateLaborEntry(rowIndex, dayIndex, timeOfDay, value, false);
        const workDate = new Date(weekRanges[filters.dateRange].start);
        workDate.setHours(0, 0, 0, 0);
        const validDay = validDaysOfWeek[dayIndex];
        const actualDayIndex = daysOfWeek.findIndex(
            d => d.trim() !== "" && d === validDay
        );
        workDate.setDate(workDate.getDate() + actualDayIndex);
        const ts = getLocalMidnightTs(workDate);
        pendingOnBlur.current = true;
        try {
            if (value === "") {
                // Deletion
                await deleteBackendRecord({
                    filters,
                    workDate,
                    poNumber,
                    timeOfDay,
                });

                await mutate((currentData) => {
                    if (!currentData) return currentData;
                    const bucket = currentData.payHours[filters.mdoc] || [];
                    return {
                        ...currentData,
                        payHours: {
                            ...currentData.payHours,
                            [filters.mdoc]: bucket.filter(
                                r =>
                                    r.po_number !== poNumber ||
                                    r.date_worked !== ts ||
                                    r.period !== timeOfDay
                            )
                        }
                    };
                }, { revalidate: false });

                setPayHours(prev => {
                    const bucket = prev[filters.mdoc] || [];
                    return {
                        ...prev,
                        [filters.mdoc]: bucket.filter(
                            r =>
                                r.po_number !== poNumber ||
                                r.date_worked !== ts ||
                                r.period !== timeOfDay
                        )
                    };
                });

                return;
            }

            // Update
            setPayHours(prev => updatedPayHours(prev, filters.mdoc, {
                po_number: poNumber,
                date_worked: ts,
                period: timeOfDay,
                laborsheet_hours: value,
                timeclock_hours: rate,
                hourly_rate: rate,
            }));

            await mutate(
                async (currentData) => {
                    if (!currentData) return currentData;
                    const payload = await updateBackendRecord(
                        { filters, weekRanges },
                        { rowIndex, dayIndex, timeOfDay, poNumber, value, rate }
                    );
                    return {
                        ...currentData,
                        payHours: updatedPayHours(
                            currentData.payHours,
                            filters.mdoc,
                            {
                                po_number: payload.po_number,
                                date_worked: Math.floor(new Date(payload.date_worked).getTime() / 1000),
                                period: payload.period,
                                laborsheet_hours: payload.laborsheet_hours,
                                timeclock_hours: payload.timeclock_hours,
                                hourly_rate: payload.hourly_rate,
                            }
                        ),
                    };
                },
                { rollbackOnError: true, revalidate: false }
            );

        } catch (err) {
            console.error("Error saving/deleting labor entry:", err);
            setSnackbarMessage("There was an error updating your entry.");
            setSnackbarOpen(true);
        } finally {
            pendingOnBlur.current = false;
        }
    };

    // Change pay rate for a worked period.
    const handleRateChange = (componentIndex, dayIndex, timeOfDay, rate) => {
        setLaborData(prevData => {
            const newData = [...prevData];
            const slotCopy = { ...newData[componentIndex] };
            const cellsCopy = [...slotCopy.cells];
            cellsCopy[dayIndex] = {
                ...cellsCopy[dayIndex],
                [timeOfDay]: { ...cellsCopy[dayIndex][timeOfDay], rate },
            };
            slotCopy.cells = cellsCopy;
            newData[componentIndex] = slotCopy;
            return newData;
        });
    };

    function updatedPayHours(
        currentPayHours,
        mdocKey,
        payload
    ) {
        const newMap = { ...currentPayHours };
        const bucket = newMap[mdocKey] || [];
        const filtered = bucket.filter(
            r =>
                r.po_number !== payload.po_number ||
                r.date_worked !== payload.date_worked ||
                r.period !== payload.period
        );
        newMap[mdocKey] = [...filtered, payload];
        return newMap;
    }

    const updateWorkerBalances = useCallback(
        (currentFilters = filters) => {
            const newWorkerBalances = {};
            const entries = workers && typeof workers === 'object'
                ? Object.entries(workers)
                : [];
            entries.forEach(([mdoc]) => {
                const filteredRecords = payHours[mdoc]
                    ? payHours[mdoc].filter(record => {
                        const weekRange = weekRanges[currentFilters.dateRange];
                        if (!weekRange) return false;
                        const recordDate = new Date(record.date_worked * 1000);
                        return recordDate >= weekRange.start && recordDate <= weekRange.end;
                    })
                    : [];
                const totalLaborsheet = filteredRecords.reduce(
                    (sum, record) => sum + (parseFloat(record.laborsheet_hours) || 0),
                    0
                );
                const totalTimeclock = filteredRecords.reduce(
                    (sum, record) => sum + (parseFloat(record.timeclock_hours) || 0),
                    0
                );
                newWorkerBalances[mdoc] = totalLaborsheet === totalTimeclock;
            });
            setWorkerBalances(newWorkerBalances);
        },
        [workers, payHours, weekRanges, filters]
    );

    useEffect(() => {
        if (filters.dateRange !== null && filters.mdoc.trim() !== "") {
            updateWorkerBalances(filters);
            loadLaborData();
        }
    }, [filters]);

    const handleBalanceValues = async () => {
        if (pendingOnBlur.current) {
            setTimeout(handleBalanceValues, 50);
            return;
        }
        pendingOnBlur.current = true;
        const { laborData: newLaborData, deletionRequests } = balanceLaborData(
            laborData,
            aggregatedWorkHours,
            validDaysOfWeek,
            daysOfWeek,
            weekRanges,
            filters.dateRange,
            distributeRounded
        );
        await Promise.all(
            deletionRequests.map(req =>
                deleteBackendRecordHandler(req.po_number, req.workDate, req.period)
            )
        );
        await batchUpdateBackendRecords(newLaborData, (params) =>
            updateBackendRecord({ filters, weekRanges }, params)
        );
        setLaborData(newLaborData);
        mutate();
        pendingOnBlur.current = false;
    };

    const handleNextUnbalanced = () => {
        if (filters.dateRange === null) {
            setSnackbarMessage("Please select a date range before proceeding.");
            setSnackbarOpen(true);
            return;
        }
        const currentMdoc = filters.mdoc.trim() || "";
        const sortedKeys = Object.keys(workerBalances).sort((a, b) => Number(a) - Number(b));
        const unbalancedKeys = sortedKeys.filter(key => workerBalances[key] === false);
        if (unbalancedKeys.length === 0) {
            setSnackbarMessage("All workers are balanced.");
            setSnackbarOpen(true);
            return;
        }
        const currentIndex = unbalancedKeys.findIndex(key => key === currentMdoc);
        const newKey =
            currentIndex !== -1
                ? unbalancedKeys[(currentIndex + 1) % unbalancedKeys.length]
                : unbalancedKeys[0];
        if (newKey === currentMdoc) {
            setSnackbarMessage("This is the last unbalanced worker.");
            setSnackbarOpen(true);
        } else {
            setFilters(prev => ({ ...prev, mdoc: newKey }));
        }
    };

    const handleNameSelect = (name) => {
        const match = nameOptions.find(o => o.label === name);
        setFilters(prev => ({
            ...prev,
            name,
            mdoc: match?.mdoc || "",
        }));
    };

    const handleDateRangeChange = (e) => {
        const newRange = e.target.value === "" ? null : parseInt(e.target.value, 10);
        const newFilters = { ...filters, dateRange: newRange };
        setFilters(newFilters);
        updateWorkerBalances(newFilters);
        loadLaborData();
    };

    const rowGroups = useMemo(() => {
        return Array.from({ length: 2 }, (_, rowIndex) => (
            <Box key={rowIndex} sx={{
                display: "flex",
                gap: 1,
                justifyContent: "center",
                padding: 0.5,
                pb: rowIndex === 0 ? 0 : 1,
                alignItems: "center",
            }}>
                {laborData
                    .slice(rowIndex * 8, rowIndex * 8 + 8)
                    .map((slot, localIndex) => (
                        <LaborForWeekPO
                            key={slot.id ?? `${rowIndex * 8 + localIndex}`}
                            rowIndex={rowIndex * 8 + localIndex}
                            laborEntry={slot}
                            production={production}
                            mdoc={filters.mdoc}
                            workers={workers}
                            onPoChange={handlePoChange}
                            onChange={handleLaborChange}
                            onBlur={handleLaborBlur}
                            onRateChange={handleRateChange}
                            filters={filters}
                            setSnackbarOpen={setSnackbarOpen}
                            setSnackbarMessage={setSnackbarMessage}
                        />
                    ))}
            </Box>
        ));
    }, [
        laborData,
        production,
        filters.mdoc,
        filters.dateRange,
        workers,
        handlePoChange,
        handleLaborChange,
        handleLaborBlur,
        handleRateChange,
    ]);

    return (
        <>
            <Box sx={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Box sx={{ display: "flex", flexDirection: "column", ml: "auto", width: "0%" }}>
                    <Autocomplete
                        freeSolo
                        selectOnFocus
                        clearOnBlur
                        handleHomeEndKeys
                        options={nameOptions.map(o => o.label)}
                        inputValue={filters.name}
                        onInputChange={(_, newInput) => {
                            // whenever the text input changes
                            handleNameSelect(newInput);
                        }}
                        onChange={(_, newValue) => {
                            // whenever the user picks from the dropdown
                            if (newValue) handleNameSelect(newValue);
                        }}
                        sx={{ width: 190, mb: 2 }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Name"
                                size="small"
                                placeholder="Enter name"
                                error={Boolean(filters.name && !filters.mdoc)}
                                helperText={filters.name && !filters.mdoc ? "Name not found" : ""}
                            />
                        )}
                    />
                    <TextField
                        select
                        size="small"
                        variant="outlined"
                        value={filters.dateRange !== null ? filters.dateRange : ""}
                        onChange={handleDateRangeChange}
                        sx={{ width: 190, "& .MuiInputBase-input": { fontSize: 13, pl: 1.4, py: 1.4 } }}
                        SelectProps={{ native: true }}
                    >
                        <option value="">Date range</option>
                        {weekRanges.map((week, idx) => {
                            const optionText = `${formatDate(week.start)} - ${formatDate(week.end)}`;
                            return (
                                <option key={idx} value={idx}>
                                    {optionText}
                                </option>
                            );
                        })}
                    </TextField>
                </Box>
                {/* Aggregated Timeclock Hours Display */}
                <Box sx={{ border: "1px solid #ccc", borderRadius: "8px", padding: 0.2, width: "200px", ml: "auto" }}>
                    {validDaysOfWeek.map((day, dayIndex) => {
                        const aggregatedAM = aggregatedWorkHours[day]?.AM || 0;
                        const aggregatedPM = aggregatedWorkHours[day]?.PM || 0;
                        const sumAM = sumForDayAndTime(dayIndex, "AM", laborData);
                        const sumPM = sumForDayAndTime(dayIndex, "PM", laborData);
                        const getColor = (balancedValue, sumValue) =>
                            Number(balancedValue) === 0 ? "gray" : Number(balancedValue) === sumValue ? "#44D62C" : "red";
                        return (
                            <Box key={day} sx={{ display: "flex", gap: 2, mt: -1 }}>
                                <p className="text-xs flex w-4 mt-2.5 mr-1 ml-1">{day}</p>
                                <TextField
                                    label=""
                                    size="small"
                                    variant="standard"
                                    placeholder="0"
                                    value={aggregatedAM || ""}
                                    sx={{
                                        flex: 1,
                                        height: 28,
                                        maxWidth: 64,
                                        "& .MuiInputBase-input": {
                                            fontSize: 10,
                                            textAlign: "center",
                                            pl: 0.2,
                                            height: 8,
                                            mt: 1.4,
                                            color: getColor(aggregatedAM, sumAM),
                                        },
                                    }}
                                />
                                <TextField
                                    label=""
                                    size="small"
                                    variant="standard"
                                    placeholder="0"
                                    value={aggregatedPM || ""}
                                    sx={{
                                        flex: 1,
                                        height: 28,
                                        maxWidth: 64,
                                        "& .MuiInputBase-input": {
                                            fontSize: 10,
                                            textAlign: "center",
                                            pl: 0.2,
                                            height: 8,
                                            mt: 1.4,
                                            color: getColor(aggregatedPM, sumPM),
                                        },
                                    }}
                                />
                            </Box>
                        );
                    })}
                </Box>
                {/* Action Buttons */}
                <Box sx={{ display: "flex", flexDirection: "column", mr: "auto" }}>
                    <Button
                        variant="contained"
                        color="primary"
                        sx={{ mb: 2, mt: 2, height: 40, width: 190 }}
                        onClick={handleBalanceValues}
                    >
                        Balance Values
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        sx={{ mb: 2, height: 40, width: 190 }}
                        onClick={handleNextUnbalanced}
                    >
                        Next Unbalanced
                    </Button>
                </Box>
            </Box>
            {rowGroups}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={4000}
                onClose={(event, reason) => {
                    if (reason === "clickaway") return;
                    setSnackbarOpen(false);
                }}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                disableWindowBlurListener
            >
                <Alert onClose={() => setSnackbarOpen(false)} severity="warning" sx={{ width: "100%" }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </>
    );
}
