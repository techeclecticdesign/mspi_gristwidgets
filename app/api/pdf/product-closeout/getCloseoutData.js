import { formatCurrency } from "@/app/lib/util";

export const getCloseoutData = ({
  ponumber,
  productionRow,
  prodMaterials,
  prodStandardsRow,
  payHours,
  workers
}) => {
  const payHoursList = Object.entries(payHours).map(([mdoc, entries]) => {
    const totalHours = entries.reduce((sum, row) => sum + (row.laborsheet_hours || 0), 0);
    const totalPay = entries.reduce((sum, row) => sum + (row.laborsheet_hours || 0) * (row.hourly_rate || 0), 0);
    const avgRate = totalHours ? totalPay / totalHours : 0;
    return { mdoc, totalHours, hourly_rate: avgRate };
  });
  // Create materials line items.
  const closeoutMaterials = prodMaterials.map(material => {
    const { stock_number, material_description, unit_cost, amt, unit } = material;
    const rawTotal = amt * unit_cost;
    return {
      stock_number,
      material_description,
      unit_cost,
      amount: `${amt} ${unit}`,
      Total: formatCurrency(rawTotal),
      rawTotal
    };
  });

  const totalMaterialCost = closeoutMaterials.reduce((sum, { rawTotal }) => sum + rawTotal, 0);

  // Build labor breakdown
  const deptAggs = {};
  const laborBreakdown = [];

  // assume payHours is an array of { mdoc, totalHours, hourly_rate }
  for (const { mdoc, totalHours, hourly_rate } of payHoursList) {
    if (!totalHours) continue;
    const worker = workers[mdoc] ?? {};
    const dept = worker.payroll_dept;
    if (dept === "Woodshop") {
      const name = worker.name ?? mdoc;
      laborBreakdown.push([`Labor - ${name}`, totalHours, hourly_rate]);
    } else {
      const deptGroup = deptAggs[dept] ??= { totalHours: 0, totalWeightedPay: 0 };
      deptGroup.totalHours += totalHours;
      deptGroup.totalWeightedPay += totalHours * hourly_rate;
    }
  }

  // Create line items for labor charges (Woodshop workers, non-Woodshop departments)
  for (const [dept, { totalHours, totalWeightedPay }] of Object.entries(deptAggs)) {
    if (!totalHours) continue;
    const avgRate = totalHours ? totalWeightedPay / totalHours : 0;
    laborBreakdown.push([`Labor - ${dept}`, totalHours, avgRate]);
  }

  // Calculate cost breakdowns
  const totalLaborCost = laborBreakdown
    .reduce((sum, [, hours, rate]) => {
      const safeHours = Number(hours) || 0;
      const safeRate = Number(rate) || 0;
      return sum + safeHours * safeRate;
    }, 0);

  const materialOverhead = totalMaterialCost * 0.2;
  return {
    po_number: ponumber,
    forField: productionRow.for || "Stock",
    product_code: productionRow.product_code,
    amount_completed: productionRow.amount_completed,
    start_date: new Date(productionRow.start_date * 1000).toLocaleDateString(),
    customer_price: formatCurrency(Number(prodStandardsRow.customer_price) || 0),
    date_completed: productionRow.date_completed
      ? new Date(productionRow.date_completed * 1000).toLocaleDateString()
      : "",
    product: productionRow.product,
    closeoutMaterials: closeoutMaterials.map(({ rawTotal, ...rest }) => rest),
    total_material_cost: formatCurrency(totalMaterialCost),
    labor_breakdown: laborBreakdown,
    total_labor_cost: formatCurrency(totalLaborCost),
    production_cost: formatCurrency(totalLaborCost + totalMaterialCost),
    overhead: formatCurrency(materialOverhead),
    total_cost: formatCurrency(totalLaborCost + totalMaterialCost + materialOverhead)
  };
};
