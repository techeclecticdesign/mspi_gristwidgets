import React from "react";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";

const RateModal = ({ open, poNumber, day, timeOfDay, rate, onRateChange, onSave, onCancel }) => {
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>
        Set Hourly Rate for {poNumber ? `${poNumber} on ` : ""}{day} {timeOfDay}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Hourly Rate"
          type="number"
          fullWidth
          value={rate}
          onChange={(e) => onRateChange(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={onSave}>Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default RateModal;
