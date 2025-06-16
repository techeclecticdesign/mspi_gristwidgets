"use client";

import { useState, useRef, useEffect } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { useGrist } from "../grist";
import { filterWorkersAsTeamLeaders, indexByPkField } from "../lib/api";

export default function WorkersViewer() {
  const grist = useGrist();
  const gristRef = useRef(null);
  const tableDataRef = useRef([]);
  const [rawRecords, setRawRecords] = useState([]);
  const [options, setOptions] = useState([]);
  const [leaderNames, setLeaderNames] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [activeOnly, setActiveOnly] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [isCrewboss, setIsCrewboss] = useState(false);
  const [defaultWage, setDefaultWage] = useState(0);
  const [newName, setNewName] = useState("");
  const [newMdoc, setNewMdoc] = useState("");
  const [addError, setAddError] = useState("");
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const wageRef = useRef();

  const deptOptions = ["Woodshop", "Upholstery", "Machineshop", "Finishing", "Unassigned"];
  const areaOptions = [
    "F/S",
    "Furn. E",
    "Jan AM",
    "M/S",
    "Office",
    "Pellet Mill",
    "Sm. Prod",
    "Stockrm",
    "Tool Crib",
    "UPH",
    "WD Crew",
    "WS",
    "Unassigned"
  ];

  const handleUpdate = async (field, value) => {
    if (!selectedRow) return;
    const updatedValue = field === "pay_rate" ? parseFloat(value) : value;
    await gristRef.current.selectedTable.update({
      id: selectedRow.id,
      fields: { [field]: updatedValue },
    });
    gristRef.current.ready({ requiredAccess: "read table" });
    setSelectedRow({ ...selectedRow, [field]: value });
  };

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setDefaultWage(data.new_worker_wage);
      })
      .catch(() => {
        console.warn("Could not fetch default wage, falling back to 0");
        setDefaultWage(0);
      });
  }, []);

  useEffect(() => {
    if (!grist) return;
    gristRef.current = grist;
    grist.ready({ requiredAccess: "read table" });
    grist.allowSelectBy();
    grist.onRecords((records) => {
      tableDataRef.current = records;
      setRawRecords(records);
      setLeaderNames(Object.keys(
        indexByPkField(filterWorkersAsTeamLeaders(records), "name")
      ).sort());
    });
  }, [grist]);

  useEffect(() => {
    let sorted = [...rawRecords].sort((a, b) =>
      (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" })
    );
    if (activeOnly) {
      sorted = sorted.filter(r => {
        const start = new Date(r.start_date);
        const end = r.end_date ? new Date(r.end_date) : null;
        return !(end && end > start);
      });
    }
    setOptions(sorted.map(r => ({ id: r.id, name: r.name })));
  }, [rawRecords, activeOnly]);

  // when user picks a worker in autocomplete
  const handleChange = async (_evt, newOpt) => {
    if (newOpt) {
      const fullRow = tableDataRef.current.find((r) => r.id === newOpt.id) || null;
      setSelectedRow(fullRow);
      setIsCrewboss(fullRow?.name && fullRow.name === fullRow.team);
      await grist.setSelectedRows([newOpt.id]);
    } else {
      setSelectedRow(null);
      await grist.setSelectedRows([]);
    }
  };

  const handleAddWorker = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const { id: newId } = await gristRef.current.selectedTable.create({
      fields: {
        name: newName,
        mdoc: newMdoc,
        start_date: new Date(today),
        pay_rate: defaultWage ?? 0,
        payroll_dept: "Unassigned",
        area: "Unassigned",
      }
    });
    const newRec = {
      id: newId,
      name: newName,
      mdoc: newMdoc,
      start_date: today,
      pay_rate: defaultWage ?? 0,
      payroll_dept: "Unassigned",
      area: "Unassigned",
      suspended: false,
    };
    tableDataRef.current.push(newRec);
    setRawRecords(rs => [...rs, newRec]);
    setOptions(opts => [...opts, { id: newId, name: newName }]);
    setSelectedRow(newRec);
    await gristRef.current.setSelectedRows([newId]);
    setAddModalOpen(false);
  };

  const handleCrewbossChange = (e) => {
    const checked = e.target.checked;
    setIsCrewboss(checked);
    const newTeam = checked
      ? (selectedRow?.name || "")
      : "Unassigned";
    handleUpdate("team", newTeam);
  };

  const isActiveWorker = (r) => {
    if (!r) return true;
    const start = new Date(r.start_date);
    const end = r.end_date ? new Date(r.end_date) : null;
    return !(end && end > start);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <h1 className="text-3xl font-bold mt-4 text-center">Workers Editor</h1>
      <div className="mx-auto mt-4 w-1/2 flex flex-col gap-4">
        <div className="flex flex-col space-y-2 mb-4">
          <div className="flex items-center space-x-1">
            <Autocomplete
              size="small"
              options={options}
              getOptionLabel={(opt) => opt?.name ?? ""}
              renderInput={(params) => {
                const record = selectedRow;
                const active = isActiveWorker(record);
                const suspended = record?.suspended;
                return (
                  <TextField
                    {...params}
                    label="Name"
                    variant="outlined"
                    sx={{
                      "& .MuiInputBase-input": {
                        color: suspended ? "blue" : (active ? undefined : "red"),
                      },
                    }}
                  />
                );
              }}
              renderOption={(props, option) => {
                const record = rawRecords.find(r => r.id === option.id);
                const active = isActiveWorker(record);
                const { key, ...rest } = props;
                return (
                  <li key={key} {...rest}>
                    <span style={{ color: active ? undefined : "red" }}>
                      {option.name}
                    </span>
                  </li>
                );
              }}
              value={
                selectedRow
                  ? { id: selectedRow.id, name: selectedRow.name ?? "" }
                  : null
              }
              onChange={handleChange}
              sx={{ flex: 1 }}
            />
            <IconButton
              size="small"
              onClick={() => { setAddError(""); setNewName(""); setNewMdoc(""); setAddModalOpen(true); }}
              aria-label="Add worker"
            >
              <AddIcon />
            </IconButton>
          </div>
          <div className="flex mr-12 h-2">
            <span className="mr-1 text-xs ml-auto">Active workers only</span>
            <Checkbox
              checked={activeOnly}
              onChange={(_, v) => {
                setActiveOnly(v);
                gristRef.current.ready({ requiredAccess: "read table" })
              }}
              size="small"
            />
          </div>

        </div>
        <div className="grid grid-cols-2 gap-4 w-full">
          <TextField
            size="small"
            variant="outlined"
            label="Mdoc"
            value={selectedRow?.mdoc ?? ""}
            InputProps={{ readOnly: true }}
          />
          <TextField
            size="small"
            variant="outlined"
            label="Wage"
            key={selectedRow?.id}
            inputRef={wageRef}
            defaultValue={selectedRow?.pay_rate ?? ""}
            onBlur={(e) => {
              const v = parseFloat(e.target.value);
              if (isNaN(v) || v < 0) {
                setToastMsg("Wage must be a number 0 or greater");
                setToastOpen(true);
              } else {
                handleUpdate("pay_rate", v);
              }
            }}
          />
          <DatePicker
            label="Hire Date"
            value={selectedRow?.start_date ? new Date(selectedRow.start_date) : null}
            onChange={(newDate) => handleUpdate("start_date", newDate)}
            slotProps={{ textField: { size: "small" } }}
          />
          <DatePicker
            label="Finish Date"
            value={selectedRow?.end_date ?? null}
            onChange={(newDate) => handleUpdate("end_date", newDate)}
            slotProps={{ textField: { size: "small" } }}
          />
          <Autocomplete
            size="small"
            options={leaderNames}
            value={selectedRow?.team || ""}
            onChange={(_, v) => handleUpdate("team", v)}
            renderInput={params => (
              <TextField {...params} label="Team" variant="outlined" />
            )}
          />
          <Autocomplete
            size="small"
            options={deptOptions}
            value={selectedRow?.payroll_dept || ""}
            onChange={(_, val) => handleUpdate("payroll_dept", val)}
            renderInput={params => (
              <TextField {...params} label="Dept" variant="outlined" />
            )}
          />
          <Autocomplete
            size="small"
            options={areaOptions}
            value={selectedRow?.area || ""}
            onChange={(_, val) => handleUpdate("area", val)}
            renderInput={params => (
              <TextField {...params} label="Area" variant="outlined" />
            )}
          />
          <TextField
            size="small"
            variant="outlined"
            label="Toolbox"
            value={selectedRow?.cartbox_number ?? ""}
            onBlur={(e) => handleUpdate("cartbox_number", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-3 gap-4 w-full">
          <FormControlLabel
            className="justify-self-center"
            control={
              <Checkbox
                checked={isCrewboss}
                onChange={handleCrewbossChange}
                size="small"
              />
            }
            label="Crewboss"
          />
          <FormControlLabel
            className="justify-self-center"
            control={
              <Checkbox
                checked={!!selectedRow?.nhifm_worker}
                onChange={(e) => handleUpdate("nhifm_worker", e.target.checked)}
                size="small"
              />
            }
            label="NHIFM"
          />
          <FormControlLabel
            className="justify-self-center"
            control={
              <Checkbox
                checked={!!selectedRow?.suspended}
                onChange={(e) => handleUpdate("suspended", e.target.checked)}
                size="small"
              />
            }
            label="Suspended"
          />
        </div>
      </div >
      {/* Add Worker Modal */}
      <Dialog open={addModalOpen} onClose={() => setAddModalOpen(false)}>
        <DialogTitle className="flex justify-between items-center">
          Add Worker
          <IconButton size="small" onClick={() => setAddModalOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent className="space-y-4">
          <TextField
            fullWidth
            label="Name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            error={!!addError && /\d/.test(newName)}
            helperText={/\d/.test(newName) ? "Name must not contain numbers" : ""}
          />
          <TextField
            fullWidth
            label="Mdoc"
            value={newMdoc}
            onChange={e => setNewMdoc(e.target.value)}
            error={!!addError && /\D/.test(newMdoc)}
            helperText={/\D/.test(newMdoc) ? "Mdoc must contain only numbers" : ""}
          />
          {addError && <Typography color="error">{addError}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddModalOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddWorker}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
      {/* validation toast */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={4000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setToastOpen(false)}>
          {toastMsg}
        </Alert>
      </Snackbar>
    </LocalizationProvider >
  );
}
