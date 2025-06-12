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

export function formatCurrency(amount) {
  return `$${amount.toFixed(2)}`;
}

/* calculate a weighted average of values array and a paired set of weights */
export function calcWeightedAverage(values, weights) {
  if (values.length !== weights.length) {
    throw new Error("Values and weights must be the same length.");
  }

  if (!Array.isArray(values) || !Array.isArray(weights)) {
    throw new Error("Both values and weights must be arrays.");
  }

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight === 0) return null;

  const weightedSum = values.reduce((sum, val, i) => sum + val * weights[i], 0);
  return weightedSum / totalWeight;
}

/* take payhours (probably after being filtered by params) and index entries by mdoc */
export function getTotalHoursForMdoc(mdoc, payHours) {
  return (payHours[mdoc] ?? []).reduce((sum, row) => sum + (row.laborsheet_hours || 0), 0);
}

/* group payhours into structure like ob[dept][mdoc], where dept is the department mdoc works in */
export function groupPayHoursByDeptAndMdoc(payHours, workers) {
  return Object.entries(payHours).reduce((acc, [mdoc, entries]) => {
    const totalHours = getTotalHoursForMdoc(mdoc, payHours);
    const hourly_rate = entries[0]?.hourly_rate ?? 0;
    const dept = workers[mdoc]?.payroll_dept ?? "Unknown";
    const deptGroup = acc[dept] ??= {};
    deptGroup[mdoc] = { mdoc, totalHours, hourly_rate };
    return acc;
  }, {});
}

// Filters an array of strings by regex
export function filterArrayByRegex(arr, regex) {
  return arr.filter(item => regex.test(item));
}

function escapeRegExp(str) {
  // escape regex metacharacters
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Filters an array of strings that start with given prefix
export function filterArrayStartsWith(arr, prefix) {
  const pattern = new RegExp('^' + escapeRegExp(prefix));
  return filterArrayByRegex(arr, pattern);
}

// Filters an array of strings that end with given suffix
export function filterArrayEndsWith(arr, suffix) {
  const pattern = new RegExp(escapeRegExp(suffix) + '$');
  return filterArrayByRegex(arr, pattern);
}

// Filters an array of strings that contain given substring
export function filterArrayContains(arr, substr) {
  const pattern = new RegExp(escapeRegExp(substr));
  return filterArrayByRegex(arr, pattern);
}

// parses templates table (indexed by product code) and returns list of wood materials
export function getTemplateWoodEntries(templates, productCode) {
  const entries = templates || [];
  return entries.filter(item => {
    const isWWStock = String(item.stock_number).slice(0, 2).toUpperCase() === 'WW';
    const isWoodshopDept = String(item.material_dept || '').toUpperCase() === 'WOODSHOP';
    return isWWStock && isWoodshopDept;
  });
}
