import { ShipTicket } from "@/app/pdf/shipTicket";
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

    const pdfStream = await renderToStream(
      <ShipTicket
        po_number={ponumber}
        product_code={productionRow.product_code}
        team={productionRow.team}
        amount_requested={productionRow.amount_requested}
        amount_completed={productionRow.amount_completed}
        customer={productionRow.customer}
        product={productionRow.product}
        date_completed={productionRow.date_completed}
      />
    );

    return new Response(pdfStream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${ponumber}-shipticket.pdf"`,
      },
    });

  } catch (error) {
    return getHttpErrorResponse("GET /api/pdf/shipticket", error);
  }
}
