"use client"

import { useState } from 'react';
import NavCard from '../components/NavCard';
import Grid from '@mui/material/Grid2';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

export default function Administration() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  const handlePrepareData = async () => {
    try {
      const res = await fetch('/api/backfill-derived-data', {
        method: 'POST',
      });
      const json = await res.json();

      if (res.ok && json.success) {
        setModalTitle('✅ Backfill Complete');
        setModalMessage(`Updated ${json.updated} record(s).`);
      } else {
        setModalTitle('❌ Backfill Failed');
        setModalMessage(json.error || 'Unknown error from server.');
      }
    } catch (err) {
      setModalTitle('❌ Network Error');
      setModalMessage(err.message);
    } finally {
      setModalOpen(true);
    }
  };

  const adminLinks = [
    {
      label: 'Backfill Data',
      onClick: handlePrepareData,
    },
  ];

  return (
    <>
      <div className="w-4/5 pt-8 m-auto">
        <Grid container spacing={3}>
          <Grid size={6} container direction="column" spacing={1.5} sx={{ height: 'fit-content' }}>
            <NavCard
              title="Navigation"
              links={adminLinks}
              width="95%"
            />
          </Grid>
        </Grid>
      </div>

      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <DialogTitle>{modalTitle}</DialogTitle>
        <DialogContent>
          <Typography>{modalMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
