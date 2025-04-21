import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";

const NhifmModal = ({ open, onConfirm, onDeny }) => {
  return (
    <Dialog open={open} onClose={onDeny}>
      <DialogTitle>NHIFM Work Day Payment</DialogTitle>
      <DialogContent>
        <p>Should NHIFM worker be paid for non-NHIFM project on his NHIFM work day?</p>
      </DialogContent>
      <DialogActions>
        <Button onClick={onConfirm}>Yes</Button>
        <Button onClick={onDeny}>No</Button>
      </DialogActions>
    </Dialog>
  );
};

export default NhifmModal;
