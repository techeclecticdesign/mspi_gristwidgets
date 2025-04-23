"use client"

import { useState } from 'react';
import NavCard from '../components/NavCard';
import Grid from '@mui/material/Grid2';
import PayrollReportModal from './components/PayrollReportModal';

export default function Payroll() {
  const gristHost = process.env.NEXT_PUBLIC_GRIST_HOST;
  const [modalOpen, setModalOpen] = useState(false);
  const payrollLinks = [
    {
      label: 'Payroll Input',
      href: gristHost + '/o/docs/qZ1weY6NyWVW/test/p/5',
      external: true,
    },
    {
      label: 'Download Payroll Reports',
      onClick: () => setModalOpen(true),
    },
  ];

  /* download the pdf */
  const handleDownload = async (range) => {
    const startSec = Math.floor(new Date(range.start).getTime() / 1000);
    const endDate = new Date(range.end);
    // convert to end of day
    endDate.setHours(23, 59, 59);
    const endSec = Math.floor(endDate.getTime() / 1000);

    const res = await fetch(
      `/api/payrollReports?start=${startSec}&end=${endSec}`
    );
    if (!res.ok) {
      console.error("Failed to generate PDF", await res.text());
      return;
    }
    // grab it as a Blob and download
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll_${startSec}_${endSec}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="w-4/5 pt-8 m-auto">
        <Grid container spacing={3}>
          <Grid size={6} container direction="column" spacing={1.5} sx={{ height: 'fit-content' }}>
            <NavCard
              title='Payroll'
              links={payrollLinks}
              width='95%'
            />
          </Grid>
        </Grid>
      </div>
      <PayrollReportModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onDownload={handleDownload}
      />
    </>
  );
}
