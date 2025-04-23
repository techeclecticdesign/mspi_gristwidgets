import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { getWeekRanges } from '/app/lib/util.js';

export default function PayrollReportModal({ open, onClose, onDownload }) {
  const formatDate = (iso) => new Date(iso).toLocaleDateString();
  const ranges = getWeekRanges();
  const [selected, setSelected] = useState(ranges[0] || '');

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>"Download Payroll Reports"</DialogTitle>
      <DialogContent>
        Choose a pay period to download reports for.
        <Select
          value={selected}
          onChange={e => setSelected(e.target.value)}
          fullWidth
          renderValue={(value) =>
            value ? `${formatDate(value.start)} - ${formatDate(value.end)}` : 'Select a week range'
          }
        >
          {ranges.map(r => (
            <MenuItem key={`${formatDate(r.start)} - ${formatDate(r.end)}`} value={r}>
              {`${formatDate(r.start)} - ${formatDate(r.end)}`}
            </MenuItem>
          ))}
        </Select>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={() => onDownload(selected)}>Download</Button>
      </DialogActions>
    </Dialog>
  );
}
