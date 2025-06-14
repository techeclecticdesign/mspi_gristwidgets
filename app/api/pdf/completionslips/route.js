import { CompletionSlips } from "@/app/pdf/completionSlips";
import { renderToStream } from "@react-pdf/renderer";
import { getHttpErrorResponse } from "@/app/lib/errors";
import { fetchWithRetry } from "@/app/lib/api";

export async function GET(req) {
  const { searchParams } = new URL(req.nextUrl);
  const ponumber = searchParams.get("ponumber");
  const origin = new URL(req.url).origin;

  try {
    const productionJson = await fetchWithRetry(
      `${origin}/api/production?ponumber=${ponumber}`
    );

    const [productionRow] = productionJson;
    const date = new Date(productionRow.start_date * 1000).toLocaleDateString();

    const pdfStream = await renderToStream(
      <CompletionSlips
        po_number={ponumber}
        product_code={productionRow.product_code}
        team={productionRow.team}
        amount_requested={productionRow.amount_requested}
        customer={productionRow.customer}
        product={productionRow.product}
        start_date={date}
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
