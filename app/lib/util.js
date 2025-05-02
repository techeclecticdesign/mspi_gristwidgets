export const getWeekRanges = () => {
  const today = new Date();

  // Determine offset from most recent Thursday
  const offset = today.getDay() >= 4 ? today.getDay() - 4 : today.getDay() + 3;
  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(today.getDate() - offset);
  currentWeekStart.setHours(0, 0, 0, 0);

  const weekRanges = [];

  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  weekRanges.push({
    start: new Date(currentWeekStart),
    end: todayEnd,
  });

  let previousStart = new Date(currentWeekStart);
  previousStart.setDate(previousStart.getDate() - 7);

  for (let i = 0; i < 4; i++) {
    const start = new Date(previousStart);
    start.setHours(0, 0, 0, 0);

    const end = new Date(previousStart);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    weekRanges.push({ start, end });

    previousStart.setDate(previousStart.getDate() - 7);
  }

  return weekRanges;
};

/* calculate total wages paid by department for a particular po */
export function calculateDeptWages(
  payHours,
  workers,
  poNumber
) {
  const relevant = payHours.filter(r => r.po_number === poNumber);
  const wagesByWorker = relevant.reduce((acc, rec) => {
    const amount = rec.laborsheet_hours * rec.hourly_rate;
    acc[rec.mdoc] = (acc[rec.mdoc] || 0) + amount;
    return acc;
  }, {});

  const deptTotals = Object.entries(wagesByWorker).reduce((acc, [mdoc, total]) => {
    const worker = workers.find(w => w.mdoc === mdoc);
    const dept = worker?.payroll_dept ?? "Unknown";
    acc[dept] = (acc[dept] || 0) + total;
    return acc;
  }, {});

  return deptTotals;
}
