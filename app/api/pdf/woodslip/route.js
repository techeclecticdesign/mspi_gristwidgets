import { WoodRequisition } from "@/app/pdf/woodRequisition";
import { renderToStream } from "@react-pdf/renderer";
import { getHttpErrorResponse } from "@/app/lib/errors";
import { fetchWithRetry } from "@/app/lib/api";
import { getTemplateWoodEntries } from "@/app/lib/util";

export async function GET(req) {
  const { searchParams } = new URL(req.nextUrl);
  const ponumber = searchParams.get("ponumber");
  const productcode = searchParams.get("productcode");
  const origin = new URL(req.url).origin;
  try {
    const productionJson = await fetchWithRetry(
      `${origin}/api/production?ponumber=${ponumber}`
    );
    const [productionRow] = productionJson;
    const templates = await fetchWithRetry(
      `${origin}/api/templates?productcode=${productcode}`
    );

    const filteredTemplates = getTemplateWoodEntries(templates, productcode);
    const date = new Date(productionRow.start_date * 1000).toLocaleDateString();

    //TODO I need to make the date a string in expected format.

    const pdfStream = await renderToStream(
      <WoodRequisition
        po_number={ponumber}
        product_code={productcode}
        team={productionRow.team}
        amount_requested={productionRow.amount_requested}
        product={productionRow.product}
        start_date={date}
        templates={filteredTemplates}
      />
    );


    return new Response(pdfStream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${ponumber}-wood-requisition.pdf"`,
      },
    });

  } catch (error) {
    return getHttpErrorResponse("GET /api/pdf/wood-requisition", error);
  }
}
