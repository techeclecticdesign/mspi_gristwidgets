import { ShipTicket } from "@/app/pdf/shipTicket";
import { renderToStream } from "@react-pdf/renderer";
import { getHttpErrorResponse } from "@/app/lib/errors";
import { fetchWithRetry } from "@/app/lib/api";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const ponumber = searchParams.get('ponumber');
  const origin = new URL(req.url).origin;
  try {
    const productionJson = await fetchWithRetry(
      `${origin}/api/production?ponumber=${ponumber}`
    );
    const [productionRow] = productionJson;
    const team = productionRow.team;
    const desc = productionRow.product;
    const amount = productionRow.amount_completed;

    const pdfStream = await renderToStream(
      <ShipTicket ponumber={ponumber} team={team} desc={desc} amount={amount} />
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
