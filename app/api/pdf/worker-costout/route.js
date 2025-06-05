import { Costout } from "@/app/pdf/costout";
import { getCostoutData } from "./getCostoutData";
import { renderToStream } from "@react-pdf/renderer";
import { getHttpErrorResponse } from "@/app/lib/errors";
import {
  fetchWithRetry,
  batchFetch,
  indexByPkField,
  groupByField
} from "@/app/lib/api";
import { formatCurrency } from "@/app/lib/util";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const ponumber = searchParams.get("ponumber");
  const product_code = searchParams.get("productcode");
  const origin = new URL(req.url).origin;

  try {
    const prodByCodeJson = await fetchWithRetry(
      `${origin}/api/production?productcode=${product_code}`
    );
    // grab the first six projects with this po that have been completed
    const firstFive = prodByCodeJson
      .filter(r => r.amount_completed > 0 && r.date_completed)
      .slice(0, 6);
    // if our current po is among them, remove it, otherwise drop the last match (giving us 5 total)
    const historyRows = firstFive
      .filter(r => r.po_number !== ponumber)
      .slice(0, 5);

    const [rawStandards, rawWorkers, rawInventory] = await batchFetch(
      `${origin}/api/prodstandards`,
      `${origin}/api/workers`,
      `${origin}/api/inventory`,
    );
    const standardsByCode = indexByPkField(rawStandards, "product_code");
    const workersByMdoc = indexByPkField(rawWorkers, "mdoc");
    const inventoryByStockNo = indexByPkField(rawInventory, "stock_number");

    const closeoutDataArray = await Promise.all(
      historyRows.map(async row => {
        const po = row.po_number;
        const [mats, hrs] = await batchFetch(
          `${origin}/api/prodmaterials?ponumber=${po}`,
          `${origin}/api/payhours?ponumber=${po}`
        );
        const hoursMap = groupByField(hrs, "mdoc");
        return {
          productionRow: row,
          prodMaterials: mats,
          prodStandardsRow: standardsByCode[row.product_code],
          payHours: hoursMap
        };
      })
    );

    const originalProdJson = await fetchWithRetry(
      `${origin}/api/production?ponumber=${ponumber}`
    );
    const [productionRow] = originalProdJson;
    if (!productionRow) {
      throw new Error(`No production record found for PO ${ponumber}`);
    }

    const [origMats, origHrs] = await batchFetch(
      `${origin}/api/prodmaterials?ponumber=${ponumber}`,
      `${origin}/api/payhours?ponumber=${ponumber}`
    );
    const origHoursMap = groupByField(origHrs, "mdoc");

    const original = {
      ponumber,
      productionRow,
      prodMaterials: origMats,
      prodStandardsRow: standardsByCode[productionRow.product_code],
      payHours: origHoursMap
    };

    const costoutData = getCostoutData(
      ponumber,
      closeoutDataArray,
      original,
      workersByMdoc,
      inventoryByStockNo
    );
    const pdfProps = {
      ...costoutData,
      team: original.productionRow.team,
      product: original.productionRow.product,
      productName: original.prodStandardsRow.product_name,
      amountCompleted: original.productionRow.amount_completed,
      dateCompleted: original.productionRow.date_completed,
      customerPrice: formatCurrency(original.prodStandardsRow.customer_price)
    };

    const pdfStream = await renderToStream(
      <Costout {...pdfProps} />
    );

    return new Response(pdfStream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${ponumber}-costout.pdf"`
      }
    });
  } catch (error) {
    return getHttpErrorResponse("GET /api/pdf/product-costout", error);
  }
}
