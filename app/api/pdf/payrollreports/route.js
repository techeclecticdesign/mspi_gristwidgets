import { fetchWithRetry, env, ensureEnv } from "@/app/lib/api";
import { renderToStream } from "@react-pdf/renderer";
import { PayrollReport } from "@/app/pdf/payrollReport";
import { getHttpErrorResponse, HTTPError } from "@/app/lib/errors";

export async function GET(req) {
  try {
    ensureEnv();
    const { host, apiKey, docId } = env;
    const { searchParams } = new URL(req.url);
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");
    if (!startParam || !endParam) {
      throw new HTTPError("Missing start or end params", 400);
    }
    const startSec = parseInt(startParam, 10);
    const endSec = parseInt(endParam, 10);
    const startIso = new Date(startSec * 1000).toISOString();
    const endIso = new Date(endSec * 1000).toISOString();
    const sql = `SELECT * FROM PayHours
      WHERE date(date_worked,'unixepoch') >= date(${startSec},'unixepoch')
        AND date(date_worked,'unixepoch') <= date(${endSec},'unixepoch')`;
    const url = `${host}/api/docs/${docId}/sql?q=${encodeURIComponent(sql)}`;
    const data = await fetchWithRetry(url, { headers: { Authorization: `Bearer ${apiKey}` } });
    const rows = data.records?.map((r) => r) || [];
    const pdfStream = await renderToStream(
      <PayrollReport startIso={startIso} endIso={endIso} rows={rows} />
    );
    return new Response(pdfStream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="payroll_${startIso.slice(0, 10)}_${endIso.slice(0, 10)}.pdf"`,
      },
    });
  } catch (err) {
    return getHttpErrorResponse("GET /api/pdf/payrollreports", err);
  }
}
