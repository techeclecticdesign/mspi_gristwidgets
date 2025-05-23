import { Closeout } from "@/app/pdf/closeout";
import { renderToStream } from "@react-pdf/renderer";
import { getCloseoutData } from "./getCloseoutData";
import { getHttpErrorResponse } from "@/app/lib/errors";
import { batchFetch, indexByPkField, groupByField } from "@/app/lib/api";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const ponumber = searchParams.get('ponumber');
  const origin = new URL(req.url).origin;
  try {
    const [
      productionJson,
      prodMaterialsJson,
      prodStandardsJson,
      payHoursJson,
      workersJson
    ] = await batchFetch(
      `${origin}/api/production?ponumber=${ponumber}`,
      `${origin}/api/prodmaterials?ponumber=${ponumber}`,
      `${origin}/api/prodstandards`,
      `${origin}/api/payhours?ponumber=${ponumber}`,
      `${origin}/api/workers`
    );
    const [productionRow] = productionJson;
    const prodStandards = indexByPkField(prodStandardsJson, "product_code");
    const prodMaterials = prodMaterialsJson;
    const payHours = groupByField(payHoursJson, "mdoc");
    const prodStandardsRow = prodStandards[productionRow.product_code];
    const workers = indexByPkField(workersJson, "mdoc");
    const closeoutProps = getCloseoutData({ ponumber, productionRow, prodMaterials, prodStandardsRow, payHours, workers });

    const pdfStream = await renderToStream(
      <Closeout {...closeoutProps} />
    );
    return new Response(pdfStream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${ponumber}-closeout.pdf"`,
      },
    });
  } catch (error) {
    return getHttpErrorResponse("GET /api/pdf/product-closeout", error);
  }
};
