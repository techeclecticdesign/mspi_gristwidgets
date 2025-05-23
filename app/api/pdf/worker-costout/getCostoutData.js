import {
  calcWeightedAverage,
  groupPayHoursByDeptAndMdoc
} from "@/app/lib/util";

// for a single payHours map, return dept: [totalHours, weightedAvgRate]
function computeDeptStats(payHours, workers) {
  const byDept = groupPayHoursByDeptAndMdoc(payHours, workers);
  const stats = {};

  Object.entries(byDept).forEach(([dept, itemsByMdoc]) => {
    const values = [], weights = [];
    Object.entries(itemsByMdoc).forEach(([mdoc, { totalHours }]) => {
      if (totalHours <= 0) return;
      const rate = (workers[mdoc] && workers[mdoc].pay_rate) || 0;
      values.push(rate);
      weights.push(totalHours);
    });

    const totalHours = weights.reduce((sum, h) => sum + h, 0);
    const weightedAvg = calcWeightedAverage(values, weights) || 0;
    stats[dept] = [totalHours, weightedAvg];
  });

  return stats;
}

// sum material cost using latest inventoryByStockNo pricing
function computeMaterialCost(prodMaterials, inventoryByStockNo) {
  return prodMaterials.reduce((sum, mat) => {
    const price = (inventoryByStockNo[mat.stock_number] || {}).unit_cost || 0;
    return sum + mat.amt * price;
  }, 0);
}

export function getCostoutData(
  ponumber,
  dataArray,           // array of 4 costouts that have the same shape as originalCostout
  originalCostout,     // the costout we are printing for
  workersByMdoc,
  inventoryByStockNo
) {

  // Dept stats for original and for dataArray[0] (the previous po)
  const origDeptStats = computeDeptStats(originalCostout.payHours, workersByMdoc);
  const prevDeptStats = dataArray[0] ? computeDeptStats(dataArray[0].payHours, workersByMdoc) : {}
  const origAmount = originalCostout.productionRow.amount_completed;
  const prevAmount = dataArray[0]?.productionRow?.amount_completed || 0;
  const origDeptUnitCost = {};
  const prevDeptUnitCost = {};
  Object.entries(origDeptStats).forEach(([dept, [hrs, rate]]) => {
    origDeptUnitCost[dept] = hrs * rate / origAmount;
  });
  Object.entries(prevDeptStats).forEach(([dept, [hrs, rate]]) => {
    prevDeptUnitCost[dept] = hrs * rate / prevAmount;
  });

  // compute unit pay‐cost per dept for each element → then average unit cost
  const allStatsArray = dataArray.map(c => ({
    stats: computeDeptStats(c.payHours, workersByMdoc),
    amt: c.productionRow.amount_completed
  }));
  const avgDeptUnitCost = {};
  Object.keys(origDeptStats).forEach(dept => {
    const sumUnitCosts = allStatsArray.reduce((sum, { stats, amt }) => {
      const [hrs, rate] = stats[dept] || [0, 0];
      return sum + (hrs * rate / amt);
    }, 0);
    avgDeptUnitCost[dept] = sumUnitCosts / dataArray.length;
  });

  // material costs (cost‐neutral using latest inventory prices)
  const origMatCost = computeMaterialCost(originalCostout.prodMaterials, inventoryByStockNo);
  const prevMatCost = dataArray[0]
    ? computeMaterialCost(dataArray[0].prodMaterials, inventoryByStockNo)
    : 0;

  const origMatUnitCost = origMatCost;
  const prevMatUnitCost = prevMatCost;

  const matUnitCostsArray = dataArray.map(c =>
    computeMaterialCost(c.prodMaterials, inventoryByStockNo)
  );
  const avgMatUnitCost = matUnitCostsArray.reduce((s, uc) => s + uc, 0) / dataArray.length;

  return {
    poNumber: ponumber,
    origDeptUnitCost,
    prevDeptUnitCost,
    avgDeptUnitCost,
    origMatUnitCost,
    prevMatUnitCost,
    avgMatUnitCost
  };
}
