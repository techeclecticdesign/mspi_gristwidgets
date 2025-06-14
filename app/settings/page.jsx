"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function SettingsPage() {
  const { data, error, mutate } = useSWR("/api/settings", fetcher);
  const [newEmployeeWage, setNewEmployeeWage] = useState("");
  const [pieWage, setPieWage] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);

  useEffect(() => {
    if (data) {
      // format wages as money strings
      setNewEmployeeWage(
        data.new_worker_wage != null ? data.new_worker_wage.toFixed(2) : ""
      );
      setPieWage(
        data.pie_wage != null ? data.pie_wage.toFixed(2) : ""
      );
    }
  }, [data]);

  const handleSubmit = async () => {
    // turn those money strings back into numbers
    const payload = {
      new_worker_wage: parseFloat(newEmployeeWage),
      pie_wage: parseFloat(pieWage),
    };

    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      setErrorDialogOpen(true);
      return;
    }

    await mutate();
    setDialogOpen(true);
  };

  if (error) return <p>Error loading settings.</p>;
  if (!data) return <p>Loading…</p>;

  return (
    <div className="max-w-md mx-auto mt-8 flex flex-col gap-4">
      <h2 className="text-2xl font-bold text-center">MSPI Database Settings</h2>

      <TextField
        label="New Employee Wage"
        size="small"
        value={newEmployeeWage}
        onChange={(e) => setNewEmployeeWage(e.target.value)}
        onBlur={() =>
          // snap to two decimals when user leaves the field
          setNewEmployeeWage((prev) =>
            prev ? parseFloat(prev).toFixed(2) : ""
          )
        }
      />

      <TextField
        label="Pie Wage"
        size="small"
        value={pieWage}
        onChange={(e) => setPieWage(e.target.value)}
        onBlur={() =>
          setPieWage((prev) =>
            prev ? parseFloat(prev).toFixed(2) : ""
          )
        }
      />

      <Button variant="contained" onClick={handleSubmit}>
        Save Settings
      </Button>
      {/* success dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Success</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Settings updated successfully
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>OK</Button>
        </DialogActions>
      </Dialog>
      {/* failure dialog */}
      <Dialog open={errorDialogOpen} onClose={() => setErrorDialogOpen(false)}>
        <DialogTitle>Error</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Failed to update settings. Please try again.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setErrorDialogOpen(false)}>OK</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
